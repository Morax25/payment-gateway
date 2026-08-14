import prisma from "../../configs/database.js";
import ApiError from "../../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { comparedPassword, hashPassword } from "../../utils/password.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const isExists = await prisma.user.findUnique({ where: { email: email } });
  if (isExists) {
    throw new ApiError("User already exists");
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return res
    .status(201)
    .json({ message: "account created successfully", data: user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }
  const isPasswordValid = await comparedPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError("Invalid credentials", 401);
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      refreshToken,
    },
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const { passwordHash, refreshToken: _, ...safeUser } = user;
  return res.status(200).json({
    message: "Logged in successfully",
    data: safeUser,
    accessToken,
  });
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) throw new ApiError("Refresh token is required", 401);
  let decode;
  try {
    decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: "payment-service",
      audience: "audience",
    });
  } catch (error) {
    throw new ApiError("Invalid or expired refresh token", 401);
  }
  const user = await prisma.user.findFirst({ where: { id: decode.sub } });
  if (!user) throw new ApiError("Invalid token", 401);
  if (user.refreshToken !== refreshToken) {
    throw new ApiError("Invalid refresh token");
  }
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    message: "Token refreshed successfully",
    accessToken: newAccessToken,
  });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await prisma.user.updateMany({
      where: { refreshToken },
      data: {
        refreshToken: null,
      },
    });
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    message: "Logged out successfully",
  });
};

export const getProfile = async(req, res) => {
  const userId = req.user.sub
  const target = req.params.id
  if(!target) throw new ApiError("params is required")
    const user = await prisma.user.findUnique({where:{id:target},select:{
      id:true, name:true, email:true, createdAt:true,
    }})
  if(!user) throw new ApiError("User does not exists")
  return res.status(200).json({success:true, message:"data found successfully", data:user})
}

