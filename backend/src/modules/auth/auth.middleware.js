import jwt from "jsonwebtoken";
import ApiError from "../../utils/ApiError.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      throw new ApiError("Authentication required", 401);
    }
    const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
      throw new ApiError("Invalid Authorization header", 401);
    }
  try {
    const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: "payment-service",
      audience: "payment-client",
    });
    req.user = decode;
    console.log("decoded token", decode)
    next();
  } catch (error) {
    console.log('jwt error', error)
    throw new ApiError("Invalid or expired token");
  }
};

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
      console.log("user role", req.user.role)
    if (!req.user) {
      throw new ApiError("Authentication required", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError("Forbidden", 403);
    }

    next();
  };
};
