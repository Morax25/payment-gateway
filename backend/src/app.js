import express from 'express'

const app = express()
app.get('/', async(req,res)=>{
    return res.status(200).json({message:"server is up and running on port : 3000"})
})

export default app
