import argon2 from "argon2";
import { userModel } from "../models/auth.model.js";
import { emailQueue } from "../bullMQ/queue.js";
import { getAuth } from "firebase-admin/auth";
import { redis } from "../../../shared/redis/redis.js";
import { app } from "../config/firebase.js";
import { createSession, setSessionCookie } from "../utils/session.js";

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        const passwordHash = await argon2.hash(password, {
            type: argon2.argon2id,
        });

        const user = await userModel.create({
            name,
            email,
            passwordHash,
            provider: "local",
            emailVerified: false,
        });

        await emailQueue.add(
            "welcome-email",
            { email: user.email, username: user.name },
            { jobId: `welcome-email-${user._id}` }
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
    } catch (error) {
        return res.status(500).json({
            message: `Signup Error ${error}`,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+passwordHash");

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

        const passwordValid = await argon2.verify(user.passwordHash, password);

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const sessionID = await createSession(user);
        setSessionCookie(res, sessionID);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                provider: user.provider,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: `Login Error ${error}`,
        });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const decoded = await getAuth(app).verifyIdToken(token);

        let user = await userModel.findOne({ firebaseUID: decoded.uid });

        if (!user) {
            user = await userModel.create({
                firebaseUID: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture || "",
                provider: "google",
                emailVerified: decoded.email_verified,
            });
        } else {
            user.name = decoded.name || user.name;
            user.email = decoded.email || user.email;
            user.avatar = decoded.picture || user.avatar || "";
            user.emailVerified = decoded.email_verified ?? user.emailVerified;

            await user.save();
        }

        const sessionID = await createSession(user);
        setSessionCookie(res, sessionID);

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                provider: user.provider,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);

        return res.status(401).json({
            message: "Continue with Google Error",
        });
    }
};

export const logout = async (req, res) => {
    try {
        const sessionID = req.cookies?.session;

        if (sessionID) {
            await redis.del(`session:${sessionID}`);
        }

        res.clearCookie("session", { path: "/" });
        res.clearCookie("accessToken", { path: "/" });

        return res.status(200).json({
            message: "Logout Successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: `Logout Error ${error}`,
        });
    }
};