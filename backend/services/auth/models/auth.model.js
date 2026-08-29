import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    firebaseUID:{
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
    },

    name:{
        type:String,
        required:true,
        trim:true,
        maxlength: 50,
    },

    email:{
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
    },

    avatar:{
        type:String,
        default:""
    },

    passwordHash: {
        type: String,
        select: false,
    },

    provider: {
        type: String,
        enum: ["local", "google"],
        required: true,
    },

    emailVerified: {
        type: Boolean,
        default: false,
    },

},{timestamps:true})

export const userModel = mongoose.model("User",userSchema)