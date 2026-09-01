import express from 'express'
import { connectDB } from './config/db.js'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

app.use(express.json())
const port = process.env.PORT || 3003


app.listen(port, ()=>{
    console.log(`Server is Runing on Port ${port}`)
    connectDB()
})
