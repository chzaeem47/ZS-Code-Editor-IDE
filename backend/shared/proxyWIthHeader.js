import proxy from "express-http-proxy";

export const proxyWithHeader = (target) => {
    return proxy(target, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            const userId = srcReq.user?._id;

            if (userId) {
                proxyReqOpts.headers["x-user-id"] = userId.toString();
            }

            return proxyReqOpts;
        },

        proxyReqPathResolver: (req) => {
            return req.originalUrl.replace(/^\/api\/project/, "") || "/";
        },
    });
};