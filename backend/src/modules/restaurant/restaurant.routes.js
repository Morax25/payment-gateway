import { Router } from "express";
import { addRestaurant, getRestaurant, updateRestuarant } from "./restaurant.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../../middlewares/validate.js";
import { addRestaurantSchema, getRestaurantsSchema, paginationSchema, updateRestaurantSchema } from "./restaurant.schema.js";
import { Roles } from "../../constants/roles.js";

const router = Router()

router.get('/', authenticate, validateQuery(paginationSchema), getRestaurant)
router.post('/add', authenticate,validate(addRestaurantSchema),addRestaurant)
router.post('/update', authenticate, validate(updateRestaurantSchema), updateRestuarant)



export default router
