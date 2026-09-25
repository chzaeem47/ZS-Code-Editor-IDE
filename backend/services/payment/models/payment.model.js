import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    plan: {
        type: String,
        enum: ["pro", "team"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    currency: {
        type: String,
        default: "PKR"
    },

    credits: {
        type: Number,
        required: true
    },

    provider: {
        type: String,
        enum: ["safepay"],
        default: "safepay"
    },

    paymentId: {
        type: String,
        unique: true,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    }
}, {
    timestamps: true
});

const paymentModel = mongoose.model("Payment", paymentSchema);

export default paymentModel;