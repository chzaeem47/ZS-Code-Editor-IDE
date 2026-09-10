import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'

const file_url = process.env.FILE_SERVICE_URL

export const createFolder = async({projectId , parentId , name , userId})=>{
    try {
        const {data} = await axios.post(`${file_url}/create-folder`,
            {projectId,parentId,name},
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}

export const createFile = async({projectId,name,parentId,content = "",language = "plaintext",})=>{
    try {
        const {data} = await axios.post(`${file_url}/create-file`,
            {projectId,name,parentId,content,language,userId},
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}

export const updateFile = async({name,content = "",userId,id})=>{
    try {
        const {data} = await axios.post(`${file_url}/update/${id}`,
            {name,content},
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}


export const deleteFile = async({userId,id})=>{
    try {
        const {data} = await axios.delete(`${file_url}/${id}`,
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}


export const getTree = async({userId,projectId})=>{
    try {
        const {data} = await axios.delete(`${file_url}/tree/${projectId}`,
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}

export const getFile = async({userId,id})=>{
    try {
        const {data} = await axios.delete(`${file_url}/${id}`,
            {Headers:{
                "x-user-id":String(userId)
            }}
        )

       return data;
    } catch (error) {
        throw new Error(error)
    }
}
