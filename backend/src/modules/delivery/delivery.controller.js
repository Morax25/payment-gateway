import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import prisma from "../../configs/database.js";

export const getMyDeliveries = asyncHandler(async (req, res) => {
  const partnerId = req.user.sub;
  const deliveries = await prisma.delivery.findMany({
    where: { partnerId },
    select: {
      id: true,
      status: true,
      pickedUpAt: true,
      deliveredAt: true,
      order: {
        select: {
          id: true,
          totalAmount: true,
          restaurant: {
            select: { name: true, address: true },
          },
          items: {
            select: {
              quantity: true,
              price: true,
              menuItem: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, deliveries, "Your deliveries"));
});

export const assignDelivery = asyncHandler(async (req, res) => {
  const { orderId, partnerId } = req.body;
  const ownerId = req.user.sub;

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurant: { ownerId } },
  });
  if (!order) throw new ApiError("Order does not found", 404);
  if (order.status !== "READY")
    throw new ApiError(
      `Order must be ready to assign delivery, currently ${order.status}`,
      400,
    );
  const existingDelivery = await prisma.delivery.findUnique({
    where: { orderId },
  });
  if (existingDelivery) {
    throw new ApiError("A delivery is already assigned to this order", 409);
  }
  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: "DELIVERY_PARTNER" },
  });
  if (!partner) throw new ApiError("Invalid Delivery Partner", 400);
  const partnerBusy = await prisma.delivery.findFirst({
    where: {
      partnerId,
      status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    },
  });
  if (partnerBusy)
    throw new ApiError(
      "This delivery partner already has an active delivery",
      409,
    );
  const [delivery] = await prisma.$transaction([
    prisma.delivery.create({
      data: { orderId, partnerId, status: "ASSIGNED" },
    }),
    prisma.order.update({
      where: {
        id: orderId,
      },
      data: { status: "OUT_FOR_DELIVERY" },
    }),
  ]);
  return res
    .status(201)
    .json(new ApiResponse(201, delivery, "Delivery Assiged to rider"));
});

export const markPickup = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const partnerId = req.user.sub;
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      partnerId,
    },
  });
  if (!delivery) throw new ApiError("Delivery not found", 404);
  if (delivery.status !== "ASSIGNED")
    throw new ApiError(`Cannot mark pick up from status : ${delivery.status}`);
  const updated = await prisma.delivery.update({
    where: { id },
    data: {
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "marked picked up"));
});

export const markDelivered = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const partnerId = req.user.sub;
  const delivery = await prisma.delivery.findFirst({
    where: { id, partnerId },
  });
  if (!delivery) throw new ApiError("Delivery not found", 404);
  if (delivery.status !== "PICKED_UP") {
    throw new ApiError(
      `Delivery must be picked up before marking delivered, currently ${delivery.status}`,
    );
  }
  const [updateDelivery] = await prisma.$transaction([
    prisma.delivery.update({
      where: { id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    }),
    prisma.order.update({
      where: {
        id: delivery.orderId,
      },
      data: {
        status: "DELIVERED",
      },
    }),
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, updateDelivery, "Delivered"));
});

export const getDeliveryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;
  const role = req.user.role;
  const delivery = await prisma.delivery.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      pickedUpAt: true,
      deliveredAt: true,
      partnerId: true,
      order: {
        select: {
          id: true,
          customerId: true,
          totalAmount: true,
          restaurant: {
            select: { name: true, address: true, ownerId: true },
          },
          items: {
            select: {
              quantity: true,
              price: true,
              menuItem: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!delivery) throw new ApiError("Delivery not found", 404);
  const isPartner = delivery.partnerId === userId;
  const isCustomer = delivery.order.customerId === userId;
  const isOwner = delivery.order.restaurant.ownerId === userId;

  if (!isPartner && !isCustomer && !isOwner && role !== "ADMIN") {
    throw new ApiError("Not authorized to view this delivery", 403);
  }
  return res.status(200).json(new ApiResponse(200, delivery, "Delivery found"));
});
