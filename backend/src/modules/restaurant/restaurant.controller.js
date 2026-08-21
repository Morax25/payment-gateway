import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import prisma from "../../configs/database.js";
import paginationParams from "../../utils/pagination.js";

export const getRestaurant = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req.query);
  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.restaurant.count(),
  ]);
  if (restaurants.length <= 0) {
    throw new ApiError("No restaurants available");
  }
  console.log("this is returned data for restaurant", restaurants, total);
  res
    .status(200)
    .json(
      new ApiResponse(201, restaurants, "restaurants retrived successfully"),
    );
});

export const addRestaurant = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  const ownerId = req.user?.sub;
  if (!ownerId) {
    throw new ApiError("Unauthorized request", 401);
  }
  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        owner: {
          connect: {
            id: ownerId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        isOpen: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res
      .status(201)
      .json(
        new ApiResponse(201, restaurant, "Restaurant registered successfully"),
      );
  } catch (error) {
    if (error.code === "P2002") {
      throw new ApiError("Restaurant already exists", 409);
    }
    if (error.code === "P2025") {
      throw new ApiError("Restaurant owner not found", 404);
    }
    throw error;
  }
});

export const updateRestuarant = asyncHandler(async (req, res) => {
  const { id, name, description, address } = req.body;
  const ownerID = req.user.sub;

  let restaurant;
  try {
    restaurant = await prisma.restaurant.update({
      where: {
        id,
        ownerId: ownerID,
      },
      data: { name, description, address },
      select: {
        id: true,
        name: true,
        address: true,
        isOpen: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(
        "Restaurant not found or you don't have permission to update it",
        404,
      );
    }
    throw err;
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        restaurant,
        "Restaurant details updated successfully.",
      ),
    );
});

export const getOwnRestaurants = asyncHandler(async (req, res) => {
  const ownerID = req.user.sub;
  const { page, limit, skip } = paginationParams(req.query);
  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where: { ownerId: ownerID },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        address: true,
        isOpen: true,
        createdAt: true,
      },
    }),
    prisma.restaurant.count({ where: { ownerId: ownerID } }),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { restaurants, total, page, limit },
        "Your restaurants fetched successfully.",
      ),
    );
});

export const restaurantClosed = asyncHandler(async (req, res) => {
  const { id, status } = req.body; // status: boolean (isOpen)
  const ownerId = req.user.sub;
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, ownerId },
  });
  if (!restaurant) {
    throw new ApiError(
      "Restaurant not found or you don't have permission",
      404,
    );
  }
  const updated = await prisma.restaurant.update({
    where: { id },
    data: { isOpen: status },
    select: {
      id: true,
      name: true,
      isOpen: true,
      updatedAt: true,
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated,
        `Restaurant marked as ${updated.isOpen ? "open" : "closed"}.`,
      ),
    );
});

export const getRestaurantSingle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurant = await prisma.restaurant.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      isOpen: true,
      updatedAt: true,
    },
  });
  return res.status(200).json(new ApiResponse(200, restaurant, "Restaurant found"))
});

