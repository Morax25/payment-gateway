import asyncHandler from "../../utils/asyncHandler.js";
import prisma from "../../configs/database.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { OrderStatus } from "@prisma/client";
import { includes, object } from "zod";

const ALLOWED_TRANSITIONS = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items } = req.body;
  const customerId = req.user.sub;
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      isOpen: true,
    },
  });
  if (!restaurant)
    throw new ApiError("Restaurant is not found or is closed", 404);
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: menuItemIds,
      },
      restaurantId,
      isAvailable: true,
    },
  });
  if (menuItems.length !== items.length) {
    throw new ApiError("One or more items unavailable or invalid", 400);
  }
  let totalAmount = 0;
  const orderItemsData = items.map(({ menuItemId, quantity }) => {
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    const lineTotal = Number(menuItem.price) * quantity;
    totalAmount += lineTotal;
    return { menuItemId, quantity, price: menuItem.price };
  });
  const order = await prisma.order.create({
    data: {
      customerId,
      restaurantId,
      totalAmount,
      items: { create: orderItemsData },
    },
    include: {
      items: true,
    },
  });
  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const ownerId = req.user.sub;
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId },
  });
  if (!restaurant) throw new ApiError("Restaurant not found or not yours", 404);

  const orders = await prisma.order.findMany({
    where: { restaurantId },
    include: {
      items: { include: { menuItem: true } },
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved"));
});

export const orderUpdateStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;
  const ownerId = req.user.sub;
  if (!Object.values(OrderStatus).includes(status)) {
    throw new ApiError("Invalid status value", 400);
  }
  const order = await prisma.order.findFirst({
    where: { id, restaurant: { ownerId } },
  });

  if (!order) {
    throw new ApiError("Order not found", 404);
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Order status updated."));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const customerId = req.user.sub;
  const order = await prisma.order.findFirst({
    where: { id, customerId },
  });
  if (!order) throw new ApiError("Order not found", 400);
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw new ApiError("Order can no longer be cancelled");
  }
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });
  return res.status(200).json(new ApiResponse(200, updated, "Order cancelled"));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;
  const role = req.user.role;
  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      restaurant: true,
      customer: { select: { name: true, email: true } },
    },
  });
  const isOwner = order.restaurant.ownerId === userId;
  const isCustomer = order.restaurant.customerId === userId;
  if (!isOwner && !isCustomer && role !== "ADMIN") {
    throw new ApiError("Not authorized to view this order", 403);
  }
  if (!order) throw new ApiError("Order not found", 404);
  res.status(200).json(new ApiResponse(200, order, "Order found"));
});


