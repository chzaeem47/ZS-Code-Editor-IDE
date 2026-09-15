import { Router } from "express";
// We are adding googleLogin and logout to the imports here:
import { signup, login, googleLogin, logout } from "../controllers/auth.controller.js";
import { signupSchema, loginSchema, validate } from "../middlewares/auth.validator.js";
import { signupRateLimiter, loginRateLimiter } from "../middlewares/rateLimiting.js";

const router = Router();

/**
* - /api/auth/signup 
* Rate Limiter Middleware
* Validate Schema Middleware
*/
router.post("/signup", validate(signupSchema), signupRateLimiter, signup);

/**
* - /api/auth/login
* Rate Limiter Middleware
* Validate Schema Middleware
*/
router.post("/login", loginRateLimiter, validate(loginSchema), login);

/**
* - /api/auth/google
*/
router.post("/google", googleLogin);

router.get('/logout',logout)


export default router;