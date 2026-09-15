import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";

import {protect} from "../services/auth/middlewares/protect.js";

import {proxyWithHeader} from "../shared/proxyWIthHeader.js";

/*
*Dot Env Configuration
*/
dotenv.config();

const app = express();

const port =
    process.env.PORT || 3000;

/*
* Cors So that our frontend or backend communicate without Cross origin errors
*/
app.use(cors({
        origin:
            process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));

/*
* Built in Middleware Looks for req's where content-type header = application/x-www-form-
*/
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

/*
* Use to log Incoming HTTP req directly into your console
*/
app.use(morgan("dev"));

/*
* AUTH Service SERVER
*/
app.use("/api/auth",proxy(
        process.env.AUTH_SERVICE,
        {
            proxyReqPathResolver: (req) => {
                return `/api/auth${req.url}`;
            },
        }
    )
);

/*
* Get Current User
*/
app.use("/api/me",proxy(

        process.env.AUTH_SERVICE,{
            
            proxyReqPathResolver: () => {
                return "/me";
            },
        }
    )
);

/*
* Project Service SERVER
*/
app.use("/api/project",protect,
    proxyWithHeader(
        process.env.PROJECT_SERVICE,
        "project"
    )
);

/*
* File Service SERVER
*/
app.use("/api/file",protect,
    proxyWithHeader(
        process.env.FILE_SERVICE,
        "file"
    )
);

/*
* AI Service SERVER
*/
app.use("/api/ai",protect,
    proxyWithHeader(
        process.env.AI_SERVICE,
        "ai"
    )
);


app.listen(port,() => {
        
    console.log(`Gateway is running on Port ${port}`);

    }
);