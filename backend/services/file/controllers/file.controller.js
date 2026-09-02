import { fileModel } from "../models/file.model.js"
import { buildTree } from "../utils/buildTree.js"

export const createRootFolder = async(req,res)=>{

    try {
        const {projectId,projectName} = req.body
        const userId = req.headers['x-user-id']

        if(!projectId || !projectName){
            return res.status(401).json({message : "Project ID & Name is Required"})
        }

        const exsistingRootFolder = await fileModel.findOne({
            projectId,
            parentId:null,
            isDeleted:false
        })

        if(exsistingRootFolder){
            return res.status(401).json({message : "Root Folder Already Exists"})
        }

        const rootFolder = await fileModel.create({
            owner:userId,
            projectId,
            name:projectName,
            type:"folder",
            parentId:null
        })

        return res.status(201).json(rootFolder)
    } catch (error) {
        return res.status(500).json({message : `Creating Root Folder Error ${error}`})
    }
}


export const createFolder = async(req,res)=>{

    try {
        const {projectId,name,parentId} = req.body
        const userId = req.headers['x-user-id']

        if(!projectId || !name || !parentId){
            return res.status(401).json({message : "Parent ID & Name is Required"})
        }

        const exist = await fileModel.findOne({
            name,
            projectId,
            parentId,
            isDeleted:false
        })

        if(exist){
            return res.status(401).json({message : "Folder Already Exists"})
        }

        const folder = await fileModel.create({
            owner:userId,
            projectId,
            name,
            type:"folder",
            parentId
        })

        return res.status(201).json(folder)
    } catch (error) {
        return res.status(500).json({message : `Create Folder Error ${error}`})
    }
}


export const createFile = async(req,res)=>{

    try {
        const {projectId,name,parentId,content="",language="plaintext"} = req.body
        const userId = req.headers['x-user-id']

        if(!projectId || !name || !parentId){
            return res.status(401).json({message : "Parent ID & Name is Required"})
        }

        const exist = await fileModel.findOne({
            name,
            projectId,
            parentId,
            isDeleted:false
        })

        if(exist){
            return res.status(401).json({message : "File Already Exists"})
        }

        const extension = name.includes(".")?name.split(".").pop():""

        const file = await fileModel.create({
            owner:userId,
            projectId,
            name,
            type:"file",
            language,
            extension,
            content,
            size:content.length,
            parentId:parentId || null
        })

        return res.status(201).json(file)
    } catch (error) {
        return res.status(500).json({message : `Create File Error ${error}`})
    }
}


export const updateFile = async(req,res)=>{

    try {
        const {projectId,name,parentId,content="",language="plaintext"} = req.body
        const userId = req.headers['x-user-id']

        const file = await fileModel.findOne({
            _id:req.params.id,
            owner:userId,
            isDeleted:false
        })

        if(file){
            return res.status(401).json({message : "File Already Exists"})
        }

        if(name){
            file.name = name
            const extension = name.includes(".")?name.split(".").pop():""
        }

        if(content!==undefined){
            file.content = content
            file.size = content.length
        }

        await file.save()

        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({message : `Update File Error ${error}`})
    }
}

export const deleteFile = async(req,res)=>{

    try {
        const userId = req.headers['x-user-id']

        const file = await fileModel.findByIdAndUpdate(req.params.id, {
            isDeleted:true
        })

        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({message : `Delete File Error ${error}`})
    }
}


export const getFile = async(req,res)=>{

    try {
        const userId = req.headers['x-user-id']

        const file = await fileModel.findOne({
            _id:req.params.id,
            owner:userId,
            isDeleted:false
        })

        if(!file){
            return res.status(401).json({message : "File Not Found"})
        }

        return res.status(200).json(file)

    } catch (error) {
        return res.status(500).json({message : `Delete File Error ${error}`})
    }
}


export const getTree = async(req,res)=>{

    try {
        const userId = req.headers['x-user-id']
        const {projectId} = req.params

        const files = await fileModel.findOne({
            projectId,
            owner:userId,
            isDeleted:false
        }).sort({
            name:1,
            type:-1
        })

        const tree = await buildTree(files)

        return res.status(200).json(tree)

    } catch (error) {
        return res.status(500).json({message : `Get Tree Error ${error}`})
    }
}