import asyncHandler from "../../utils/asyncHandler.js";
import prisma from "../../configs/database.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

export const addMenu = asyncHandler(async (req, res) => {
  const { id, name, description, price } = req.body;
  const ownerID = req.user.sub;
  // Ownership verification — restaurant must exist AND belong to this user
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, ownerId: ownerID },
  });

  if (!restaurant) {
    throw new ApiError(
      "Restaurant not found or you don't have permission",
      404,
    );
  }

  //   // Prevent duplicate menu item names within the same restaurant
  //   const duplicate = await prisma.menuItem.findFirst({
  //     where: {
  //       restaurantId: id,
  //       name: { equals: name.trim(), mode: "insensitive" },
  //     },
  //   });

  //   if (duplicate) {
  //     throw new ApiError(
  //       "A menu item with this name already exists in this restaurant",
  //       409,
  //     );
  //   }

  // Create the menu item
  const menuItem = await prisma.menuItem.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      price,
      restaurantId: id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      isAvailable: true,
      restaurantId: true,
      createdAt: true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, menuItem, "Menu item added successfully."));
});

export const getMenu = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const menuItems = await prisma.menuItem.findMany({ where: { restaurantId } });
  if (menuItems.length <= 0) {
    throw new ApiError("No items found");
  }
  return res.status(200).json(new ApiResponse(200, menuItems, "Items found"));
});

export const updateMenu = asyncHandler(async (req, res) => {
  const { id, name, description, price } = req.body;
  const ownerId = req.user.sub;

  console.log("Incoming update request:", { id, ownerId });

  const existing = await prisma.menuItem.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  console.log("Found menu item:", existing);

  if (!existing) {
    throw new ApiError("Menu item does not exist", 404);
  }
  if (existing.restaurant.ownerId !== ownerId) {
    throw new ApiError("You don't own this menu item", 403);
  }

  const result = await prisma.menuItem.update({
    where: { id },
    data: { name, description, price },
  });

  return res.status(200).json(new ApiResponse(200, result, "Data found"));
});

export const deleteMenu = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const ownerId = req.user.sub;
  const deleteItem = await prisma.menuItem.delete({
    where: { id, restaurant: { ownerId } },
  });
  if (!deleteItem) throw new ApiError("Menu item does not exists", 400);
  return res
    .status(200)
    .json(new ApiResponse(200, deleteItem, "Item deleted successfully"));
});

export const updateavailability = asyncHandler(async (req, res) => {
  const { id, availability } = req.body;
  const ownerId = req.user.sub;
  const updated = await prisma.menuItem.update({
    where: {
      id,
      restaurant: { ownerId },
    },
    data: { isAvailable: availability },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "availability updated"));
});
