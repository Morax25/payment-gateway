import express, { urlencoded } from 'express'
import { config } from 'dotenv'
import { validate } from './middlewares/validate.js'
import { registerSchema } from './modules/auth/auth.schema.js'
import errorHandler from './middlewares/errorHandler.js'
import authRouter from './modules/auth/auth.routes.js'
import restaurantRouter from './modules/restaurant/restaurant.routes.js'
import cookieParser from 'cookie-parser'
import menuRouter from './modules/menu/menu.routes.js'
import orderRouter from './modules/order/order.routes.js'
import deliveryRouter from './modules/delivery/delivery.routes.js'
config()

const app = express()

app.use(express.json())
app.use(urlencoded())
app.use(cookieParser())
app.use('/api/auth',authRouter)
app.use('/api/restaurant', restaurantRouter)
app.use('/api/menu',menuRouter)
app.use('/api/order', orderRouter)
app.use('/api/delivery',deliveryRouter)
app.use(errorHandler);

export default app
