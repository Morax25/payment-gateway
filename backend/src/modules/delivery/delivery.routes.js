import { Router } from "express"
import { assignDelivery, getDeliveryById, getMyDeliveries, markDelivered, markPickup } from "./delivery.controller.js";
import {authenticate, authorize} from '../../middlewares/auth.middleware.js'

const router = Router()
router.get('/', authenticate, authorize("DELIVERY_PARTNER"), getMyDeliveries)
router.get('/:id', authenticate, getDeliveryById)
router.post('/assign', authenticate, assignDelivery)
router.patch('/mark-pickup', authenticate, markPickup)
router.patch('/delivered', authenticate, markDelivered)

export default router;
