import { Router } from "express";
import {
  addRestaurant,
  getOwnRestaurants,
  getRestaurant,
  getRestaurantSingle,
  restaurantClosed,
  updateRestuarant,
} from "./restaurant.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.js";
import {
  addRestaurantSchema,
  getRestaurantsSchema,
  paginationSchema,
  updateRestaurantSchema,
} from "./restaurant.schema.js";
import { Roles } from "../../constants/roles.js";

const router = Router();

router.get("/", authenticate, validateQuery(paginationSchema), getRestaurant);
router.post(
  "/add",
  authenticate,
  validate(addRestaurantSchema),
  authorize("RESTAURANT_OWNER"),
  addRestaurant,
);
router.patch(
  "/update",
  authenticate,
  validate(updateRestaurantSchema),
  authorize("RESTAURANT_OWNER"),
  updateRestuarant,
);
router.get(
  "/own",
  authenticate,
  authorize("RESTAURANT_OWNER"),
  getOwnRestaurants,
);
router.post(
  "/status",
  authenticate,
  authorize("RESTAURANT_OWNER"),
  restaurantClosed,
);
router.post("/:id", authenticate, getRestaurantSingle);

export default router;
