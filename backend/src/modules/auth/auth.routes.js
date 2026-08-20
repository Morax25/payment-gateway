import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { getProfile, login, logout, refreshAccessToken, registerUser } from "./auth.controller.js";
import {authenticate, authorize } from '../../middlewares/auth.middleware.js'

const router = Router()
router.post('/register', validate(registerSchema), registerUser)
router.post('/login',validate(loginSchema),login)
router.post('/refreshacesstoken', refreshAccessToken)
router.get('/profile/:id', authenticate, getProfile)
router.get('/logout', authenticate, logout)

export default router
