import express from "express";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import router from "./routes/file.route.js";

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3003;

app.use("/", router);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(
                `File Service is running on Port ${port}`
            );
        });
    } catch (error) {
        console.error(
            "File Service startup failed:",
            error
        );

        process.exit(1);
    }
};

startServer();