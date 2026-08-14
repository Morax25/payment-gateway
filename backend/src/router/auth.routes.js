import { Router } from "express";
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../modules/auth/auth.validation.js";
import prisma from "../configs/database.js";
import ApiError from "../utils/ApiError.js";
import { hashPassword } from "../utils/password.js";
import { getProfile, login, refreshAccessToken, registerUser } from "../modules/auth/auth.controller.js";
import { authenticate, authorize } from "../modules/auth/auth.middleware.js";


const router = Router()
router.post('/register', validate(registerSchema), registerUser)
router.post('/login',validate(loginSchema),login)
router.post('/refreshacesstoken', refreshAccessToken)
router.get('/profile/:id', authenticate,authorize("ADMIN"), getProfile)

export default router
