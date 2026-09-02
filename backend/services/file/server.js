import express from 'express'
import { connectDB } from './config/db.js'
import dotenv from 'dotenv'
import router from './routes/file.route.js'
dotenv.config()

const app = express()

app.use(express.json())
const port = process.env.PORT || 3003

app.use("/" , router)

app.listen(port, ()=>{
    console.log(`Server is Runing on Port ${port}`)
    connectDB()
})
