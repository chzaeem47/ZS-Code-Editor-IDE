import { userModel } from "../models/auth.model.js";

export const getCurrUser = async(req,res)=>{
    try{
        return res.status(200).json(req.user);
    }catch(error){
        return res.status(500).json({message:`Get Curr User Error: ${error.message}`});
    }
};

export const deductCredits = async(req,res)=>{
    try{
        const userId = req.user._id;
        const {amount} = req.body;

        if(!Number.isInteger(amount) || amount <= 0){
            return res.status(400).json({message:"Invalid credit amount"});
        }

        const user = await userModel.findOneAndUpdate(
            {_id:userId,credits:{$gte:amount}},
            {$inc:{credits:-amount}},
            {new:true}
        ).select("credits");

        if(!user){
            return res.status(400).json({message:"Insufficient credits"});
        }

        return res.status(200).json({
            message:"Credits deducted successfully",
            credits:user.credits
        });
    }catch(error){
        return res.status(500).json({
            message:`Deduct Credits Error: ${error.message}`
        });
    }
};

export const addCredits=async(req,res)=>{
    try{
        const userId=req.user._id;
        const {credits}=req.body;

        if(!Number.isInteger(credits)||credits<=0){
            return res.status(400).json({message:"Invalid credit amount"});
        }

        const user=await userModel.findByIdAndUpdate(
            userId,
            {$inc:{credits}},
            {new:true}
        ).select("credits");

        if(!user){
            return res.status(404).json({message:"User Not Found"});
        }

        return res.status(200).json({
            message:"Credits added successfully",
            credits:user.credits
        });
    }catch(error){
        return res.status(500).json({
            message:`Add Credits Error: ${error.message}`
        });
    }
};