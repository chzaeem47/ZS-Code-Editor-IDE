import "dotenv/config";

import { Queue } from "bullmq";
import { redis } from "../../../shared/redis/redis.js";

/*
* Email Queue Where tasks are stored then workers perform them side by side
*/
export const emailQueue = new Queue("emailQueue", {

    connection:redis,

    defaultJobOptions: {

        attempts: 5,

        backoff: {
            type: "exponential",
            delay: 5000,
        },

        removeOnComplete: 100,

        removeOnFail: 500,
    },
});