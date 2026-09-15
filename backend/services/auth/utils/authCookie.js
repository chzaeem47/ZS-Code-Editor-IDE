export const setAuthCookie = (res, token) => {

    /*
    * Protects User token from XSS Attacks
    * Prevents Cross-Site Request Forgery
    * These are For production when app is Live
    */
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 15 * 60 * 1000,
        path: "/",
    });
};