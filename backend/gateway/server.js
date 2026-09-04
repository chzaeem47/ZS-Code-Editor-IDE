import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";

import {protect} from "../services/auth/middlewares/protect.js";

import {proxyWithHeader} from "../shared/proxyWIthHeader.js";

dotenv.config();

const app = express();

const port =
    process.env.PORT || 3000;

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(
    express.json({
        limit: "10kb",
    })
);

app.use(cookieParser());

app.use(morgan("dev"));


app.use("/api/auth",proxy(
        process.env.AUTH_SERVICE,
        {
            proxyReqPathResolver: (
                req
            ) => {
                return `/api/auth${req.url}`;
            },
        }
    )
);

app.use("/api/me",proxy(

        process.env.AUTH_SERVICE,
        {
            proxyReqPathResolver: () => {
                return "/me";
            },
        }
    )
);

app.use("/api/project",protect,
    proxyWithHeader(
        process.env.PROJECT_SERVICE,
        "project"
    )
);

app.use("/api/file",protect,
    proxyWithHeader(
        process.env.FILE_SERVICE,
        "file"
    )
);


app.listen(port,() => {
        
    console.log(`Gateway is running on Port ${port}`);

    }
);