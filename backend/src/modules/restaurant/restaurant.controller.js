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
  const isExists = await prisma.restaurant.findFirst({ where: { id: id } });
  if (!isExists) {
    throw new ApiError("Restaurant does not exists", 401);
  }
  const restaurant = await prisma.restaurant.update({
    where: {
      ownerId: ownerID,
    },
    data: {
      name,
      description,
      address,
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
    .status(200)
    .json(
      new ApiResponse(
        200,
        restaurant,
        "Restaurant details updated successfully.",
      ),
    );
});
