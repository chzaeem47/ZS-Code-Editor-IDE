import { projectModel } from "../models/project.model.js";
import { redis } from "../../../shared/redis/redis.js";

export const createProject = async(req,res)=>{
    
    try {
        const userID = req.headers['x-user-id']

        if(!userID){
            return res.status(401).json({message : "User ID is Required"})
        }

        const {name,description} = req.body
        const project = await projectModel.create({

            owner:userID,
            name,
            description
        })

        const key = `projects-${userID}`
        await redis.del(key)

        return res.status(201).json(project)

    } catch (error) {
        return res.status(500).json({message : `Project Creation Error ${error}`})
    }
}

export const getProjects = async(req,res)=>{
    
    try {
        const userID = req.headers['x-user-id']

        if(!userID){
            return res.status(401).json({message : "User ID is Required"})
        }

        const key = `projects-${userID}`
        let result = await redis.get(key)
        if(result){
            return res.status(200).json(JSON.parse(result))
        }

        const projects = await projectModel.find({
            owner:userID
        }).sort({updatedAt:-1})

        await redis.set(key,JSON.stringify(projects))

        return res.status(200).json(projects)

    } catch (error) {
        return res.status(500).json({message : `Get Projects Error ${error}`})
    }
}

export const getProjectById = async(req,res)=>{
    
    try {
       
        const {id} = req.params

        const project = await projectModel.findById(id);
        if(!project){
            return res.status(404).json({message : "Project Not Found"})
        }

        project.lastOpenedAt=new Date()
        await project.save()

        return res.status(200).json(project)

    } catch (error) {
        return res.status(500).json({message : `Get Project By Id Error ${error}`})
    }
}

export const getStarredProjects = async(req,res)=>{
    
    try {
        const userID = req.headers['x-user-id']

        if(!userID){
            return res.status(401).json({message : "User ID is Required"})
        }

        const key = `starred-projects-${userID}`
        let result = await redis.get(key)
        if(result){
            return res.status(200).json(JSON.parse(result))
        }

        const projects = await projectModel.find({
            owner:userID,
            starred:true
        }).sort({updatedAt:-1})

        await redis.set(key,JSON.stringify(projects))
        return res.status(200).json(projects)

    } catch (error) {
        return res.status(500).json({message : `Get Starred Projects Error ${error}`})
    }
}

export const toggleStar = async(req,res)=>{
    try {

        const {id} = req.params

        const project = await projectModel.findById(id)
        if(!project){
            return res.status(404).json({message : "Project Not Found"})
        }
        project.starred=!project.starred
        await project.save()

        const key = `starred-projects-${userID}`
        await redis.del(key)

        return res.status(200).json(project)

    } catch (error) {
        return res.status(500).json({message : `Mark Starred Projects Error ${error}`})
    }
}

export const deleteProject = async(req,res)=>{
    try {

        const {id} = req.params


        const project = await projectModel.findByIdAndDelete(id)
        if(!project){
            return res.status(404).json({message : "Project Not Found"})
        }

        const key = `starred-projects-${userID}`
        await redis.del(key)

        return res.status(200).json(project)

    } catch (error) {
        return res.status(500).json({message : `Deletion Projects Error ${error}`})
    }
}
