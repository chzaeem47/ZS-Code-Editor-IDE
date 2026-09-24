
/*
* Get Curr User API
*/

import { userModel } from "../models/auth.model"

export const getCurrUser = async(req,res)=>{
    try {
        return res.status(200).json(req.user)
    } catch (error) {
        return res.status(500).json({message : `Get Curr User Error ${error}`})
    }
}


export const deductCredits = async(req,res)=>{

    try {
        const {userId,amount} = req.body
        if(!userId){
            return res.status(401).json({message : "User ID Not Found"})
        }

        const user = await userModel.findOneAndUpdate({_id:userId,credits:{$gte:amount}},
            {
                $inc:{
                    credits:-amount
                }
        },{
            returnDocument:"after"
        }).select("credits")

        if(!user){
            return res.status(401).json({message : "Insufficient Credits"})
        }
    } catch (error) {
        
    }
}