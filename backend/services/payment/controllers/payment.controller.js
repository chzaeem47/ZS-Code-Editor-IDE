import crypto from "crypto";
import mongoose from "mongoose";
import paymentModel from "../models/paymentModel.js";

const plans = {
    pro: {
        amount: 999,
        credits: 1000
    },
    team: {
        amount: 2499,
        credits: 3000
    }
};

const getUserId = (req) => {
    return req.user?.id || req.user?._id || req.userId || req.headers["x-user-id"];
};

export const createPayment = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { plan } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "User ID not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (!plan || !plans[plan]) {
            return res.status(400).json({
                message: "Invalid payment plan"
            });
        }

        const selectedPlan = plans[plan];

        const payment = await paymentModel.create({
            userId,
            plan,
            amount: selectedPlan.amount,
            currency: "PKR",
            credits: selectedPlan.credits,
            provider: "safepay",
            paymentId: crypto.randomUUID(),
            status: "pending"
        });

        return res.status(201).json({
            message: "Payment created successfully",
            payment: {
                id: payment._id,
                paymentId: payment.paymentId,
                plan: payment.plan,
                amount: payment.amount,
                currency: payment.currency,
                credits: payment.credits,
                status: payment.status
            }
        });
    } catch (error) {
        console.error("Create Payment Error:", error);

        return res.status(500).json({
            message: "Failed to create payment"
        });
    }
};

export const getPayment = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { paymentId } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "User ID not found"
            });
        }

        const payment = await paymentModel.findOne({
            paymentId,
            userId
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        return res.status(200).json({
            payment
        });
    } catch (error) {
        console.error("Get Payment Error:", error);

        return res.status(500).json({
            message: "Failed to get payment"
        });
    }
};