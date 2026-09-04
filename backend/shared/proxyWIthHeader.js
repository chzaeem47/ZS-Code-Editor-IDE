import proxy from "express-http-proxy";

export const proxyWithHeader = (target,apiPrefix)=> {

    return proxy(target, {
        proxyReqOptDecorator: (proxyReqOpts,srcReq)=> {
            
            const userId =
                srcReq.user?._id;

            if (userId) {
                proxyReqOpts.headers[
                    "x-user-id"
                ] = userId.toString();
            }

            return proxyReqOpts;
        },

        proxyReqPathResolver: (req) => {
            const prefix = `/api/${apiPrefix}`;

            const path =
                req.originalUrl.replace(
                    new RegExp(`^${prefix}`),
                    ""
                );

            return path || "/";
        },
    });
};