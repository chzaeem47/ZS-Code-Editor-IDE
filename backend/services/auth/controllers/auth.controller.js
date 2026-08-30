import argon2 from "argon2";

import { userModel } from "../models/auth.model.js";
import { emailQueue } from "../bullMQ/queue.js";
import { generateAccessToken } from "../utils/token.js";
import { setAuthCookie } from "../utils/authCookie.js";
import {getAuth} from 'firebase-admin/auth'
import { redis } from "../../../shared/redis/redis.js";
import crypto from "node:crypto";
import { app } from "../config/firebase.js";


export const signup = async (req, res) => {

    const {name,email,password} = req.body;

    const existingUser = await userModel.findOne({
        email,
    });


    if (existingUser) {

        return res.status(409).json({

            message: "An account with this email already exists",
        });
    }

    const passwordHash = await argon2.hash(
        password,
        {
            type: argon2.argon2id,
        }
    );


    const user = await userModel.create({

        name,
        email,
        passwordHash,
        provider: "local",
        emailVerified: false,

    });

    const token = generateAccessToken(user);

    setAuthCookie(res, token);

    await emailQueue.add(

        "welcome-email",
        {
            email: user.email,

            username: user.name,
        },

        {
            jobId: `welcome-email-${user._id}`,
        }
    );


    return res.status(201).json({

        message: "Account created successfully.",

        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            provider: user.provider,
            emailVerified: user.emailVerified,
        },
    });
};

export const login = async (req, res) => {

    const {email,password} = req.body;


    const user = await userModel
        .findOne({ email })
        .select("+passwordHash");


    if (!user || !user.passwordHash) {

        return res.status(401).json({

            message: "Invalid email or password.",
        });
    }

    if (user.provider !== "local") {

        return res.status(401).json({

            message: "Login with Google",
        });
    }


    const passwordValid = await argon2.verify(
        user.passwordHash,
        password
    );


    if (!passwordValid) {

        return res.status(401).json({

            success: false,

            message: "Invalid email or password.",
        });
    }


    const token = generateAccessToken(user);

    setAuthCookie(res, token);


    return res.status(200).json({

        success: true,

        message: "Login successful.",

        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            provider: user.provider,
            emailVerified: user.emailVerified,
        },
    });
};

export const googleLogin = async(req,res)=>{

    try {
        
        const {token} = req.body
        const decoded = await getAuth(app).verifyIdToken(token)

        let user = await userModel.findOne({
            firebaseUID:decoded.uid
        })

        if(!user){
            user = await userModel.create({
                firebaseUID:decoded.uid,
                name:decoded.name,
                email:decoded.email,
                avatar:decoded.picture,
                provider: "google",
                emailVerified:decoded.email_verified
            })
        }

        const sessionID = crypto.randomUUID()

        await redis.set(`session:${sessionID}`,JSON.stringify({

            name:user.name,
            email:user.email,
            _id:user._id,
            avatar:user.avatar

        }),"EX",7*24*60*60)

        res.cookie('session',sessionID,{
            httpOnly:true,
            secure:false,
            sameSite:'strict',
            maxAge:7*24*60*60*1000
        })

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                provider: user.provider,
                emailVerified: user.emailVerified,
            }
        })

    } catch (error) {
        return res.status(401).json({
            message : "Continue with Google Error"
        })
    }
}

export const logout = async(req,res)=>{

    try {
        const sessionID = req.cookies.session
        await redis.del(`session:${sessionID}`)

        res.clearCookie("session")
        res.status(200).json({message : "Logout Successfully"})
    } catch (error) {
        res.status(401).json({message : "Logout Error"})
    }
}