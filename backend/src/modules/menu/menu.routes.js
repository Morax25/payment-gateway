import { Router } from "express";
import {
  addMenu,
  deleteMenu,
  getMenu,
  updateavailability,
  updateMenu,
} from "./menu.controller.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import addMenuItemSchema from "./menu.schema.js";

const router = Router();

router.get("/:restaurantId", authenticate, getMenu);
router.post(
  "/add",
  authenticate,
  authorize("RESTAURANT_OWNER"),
  validate(addMenuItemSchema),
  addMenu,
);
router.patch("/", authenticate, authorize("RESTAURANT_OWNER"), updateMenu);
router.delete("/:id", authenticate, authorize("RESTAURANT_OWNER"), deleteMenu);
router.patch('/availibility',
  authenticate,
  authorize("RESTAURANT_OWNER"),
  updateavailability,
);

export default router;
