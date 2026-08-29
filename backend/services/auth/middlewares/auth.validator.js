import { z } from "zod";


export const signupSchema = z.object({

    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name is too long"),

    email: z
        .string()
        .trim()
        .email("Invalid email")
        .toLowerCase(),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long"),
});


export const loginSchema = z.object({

    email: z
        .string()
        .trim()
        .email("Invalid email")
        .toLowerCase(),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password is too long"),
});


export const validate = (schema) => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {

            return res.status(400).json({
                success: false,
                message: "Invalid request data.",
                errors: result.error.flatten().fieldErrors,
            });
        }

        req.body = result.data;

        next();
    };
};