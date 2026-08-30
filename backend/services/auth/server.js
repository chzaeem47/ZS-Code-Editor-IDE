import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import { protect } from "./middlewares/protect.js";
import { getCurrUser } from "./controllers/user.controller.js";


const app = express();

const port = process.env.PORT || 3003;

app.set("trust proxy", 1); //to trust first reverse proxy sitting directly in front of it

app.use(helmet()); //Automatically set secure HTTP response headers to protect from common web vulnerabilities


app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));


app.use(express.json({ limit: "10kb" }));


app.use(cookieParser());


app.get("/", (req, res) => {

    return res.status(200).json({
        success: true,
        message: "Auth Service Running",
    });
});


app.use("/api/auth", authRoutes);

app.get('/me',protect,getCurrUser)


app.use((error, req, res, next) => {

    console.error(error);

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
});

app.listen(port, async()=>{
    try {

        console.log(`Server is Running on Port ${port}`)
        await connectDB()

    } catch (error) {
        console.log("Error While Connecting to Server",error)
    }
})