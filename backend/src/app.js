import express, { urlencoded } from 'express'
import { config } from 'dotenv'
import validate from './middlewares/validate.js'
import { registerSchema } from './modules/auth/auth.validation.js'
import errorHandler from './middlewares/errorHandler.js'
import authRouter  from './router/auth.routes.js'
import cookieParser from 'cookie-parser'
config()

const app = express()

app.use(express.json())
app.use(urlencoded())
app.use(cookieParser())
app.get('/', async(req,res)=>{
    throw new Error("unhandled error")
})
app.use('/api/auth',authRouter)
app.use(errorHandler);

export default app
