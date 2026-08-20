import { Router } from "express"
import { getMyDeliveries } from "./delivery.controller.js";
import {authenticate, authorize} from '../../middlewares/auth.middleware.js'

const router = Router()
router.get('/', authenticate, authorize("DELIVERY_PARTNER"), getMyDeliveries)
export default router;
