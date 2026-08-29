export const setAuthCookie = (res, token) => {

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