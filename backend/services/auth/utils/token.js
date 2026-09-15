import jwt from "jsonwebtoken";

/*
* Standard JWT naming claims makes your application ready for scalability
*/
export const generateAccessToken = (user) => {

    return jwt.sign(
        {
            sub: user._id.toString(),
            provider: user.provider,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "15m",
            issuer: "zs-code-auth",
            audience: "zs-code-client",
        }
    );
};