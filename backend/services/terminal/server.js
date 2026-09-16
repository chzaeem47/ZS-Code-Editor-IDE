import express from "express";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3005;


const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(
                `Terminal Service is running on Port ${port}`
            );
        });
    } catch (error) {
        console.error(
            "Terminal Service startup failed:",
            error
        );

        process.exit(1);
    }
};

startServer();