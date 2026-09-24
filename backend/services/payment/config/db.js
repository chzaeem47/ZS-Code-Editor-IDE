import mongoose from "mongoose";

/*
* File service db Connection
*/
export const connectDB = async () => {

    try {

        await mongoose.connect(process.env.MONGOOSE_URL);

        console.log("MongoDB connected");

    } catch (error) {

        console.error("MongoDB connection failed:", error.message);

        process.exit(1);
    }
};