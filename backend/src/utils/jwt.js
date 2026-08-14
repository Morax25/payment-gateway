import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,

    },
    process.env.JWT_ACCESS_SECRET,
    {
        expiresIn:process.env.JWT_ACCESS_EXPIRES_IN || '2m',
        issuer:"payment-service",
        audience:"payment-client"
    },
  );
};

export const generateRefreshToken = (user) => {
    return jwt.sign({
        sub:user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
        expiresIn:process.env.JWT_REFRESH_EXPIRES_IN,
        issuer:"payment-service",
        audience:"audience"
    }

)
}
