import "dotenv/config";

import { Worker } from "bullmq";
import { redis } from "../../../shared/redis/redis.js";

import { sendWelcomeEmail } from "../utils/email.service.js";

const worker = new Worker(
    "emailQueue",

    async (job) => {

        console.log(
            `Processing email job ${job.id}`
        );

        switch (job.name) {

            case "welcome-email":

                await sendWelcomeEmail({
                    email: job.data.email,
                    username: job.data.username,
                });

                break;


            default:

                throw new Error(
                    `Unknown email job: ${job.name}`
                );
        }

        console.log(
            `Email job ${job.id} completed`
        );
    },

    {
        connection:redis,

        concurrency: 5,
    }
);


worker.on("completed", (job) => {

    console.log(`Job completed: ${job.id}`);
});


worker.on("failed", (job, error) => {

    console.error(
        `Job failed: ${job?.id}`,
        error.message
    );
});