import express from "express";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3006;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(
                `Payment Service is running on Port ${port}`
            );
        });
    } catch (error) {
        console.error(
            "Payment Service startup failed:",
            error
        );

        process.exit(1);
    }
};

startServer();