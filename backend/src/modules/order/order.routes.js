import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { cancelOrder, getOrderById, getRestaurantOrders, orderUpdateStatus, placeOrder } from "./order.controller.js";

const router = Router();

router.get("/:id", authenticate, authorize("RESTAURANT_OWNER"), getRestaurantOrders);
router.get('/id/:id', authenticate, getOrderById)
router.post("/", authenticate, placeOrder);
router.patch("/status", authenticate, authorize("RESTAURANT_OWNER"), orderUpdateStatus)
router.patch("/cancel", authenticate, cancelOrder)

export default router;
