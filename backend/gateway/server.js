import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
    "/api/auth",
    proxy(process.env.AUTH_SERVICE, {
        proxyReqPathResolver: (req) => {
            return `/api/auth${req.url}`;
        },
    })
);

app.use(
    "/api/me",
    proxy(process.env.AUTH_SERVICE, {
        proxyReqPathResolver: () => {
            return "/me";
        },
    })
);

app.listen(port, () => {
    console.log(`Server is Running on Port ${port}`);
});