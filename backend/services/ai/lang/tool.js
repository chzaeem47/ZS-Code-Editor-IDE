import { getFile, getTree,createFolder, createFile, updateFile, deleteFile } from "../utils/fetchFile.js"
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const compactTree = (items=[])=>{
    return items.map((item)=>({
        _id:item._id,
        parentId:item.parentId,
        name:item.name,
        type:item.type,
        language:item.language,
        extension:item.extension,

        children:compactTree( item.children || [] ),
    }))
}

/*
* GET Tree Tool
*/
export const fileTools = ({projectId,userId,projectContext})=>{
    const getTreeTool = tool(async()=>{
        console.log('ai tool-get_tree')

        if(projectContext){
            return JSON.stringify({success:true,source:"ide_context",tree:projectContext,skipped:true})
        }
        const result = await getTree({projectId,userId})
        const tree = compactTree(result)
        return JSON.stringify({success:true,tree})
    },
    {
        name:"get_tree",
        description:`Get the complete project folder and file
        IMPORTANT:
        1. Use this when the project structure is unknown
        2. Do not repeatedly call get_tree
        3. type="folder" means folder
        4. type="file"  means file
        5. Folder IDs are used as parentId
        6. NEVER Call get_file with a folder Id
        7. Donot Use Terminal Commands to inspect the project
        8. Use the Exact IDs returned by this tool
        
        The tree contains: 
        _id
        parentId
        name
        type
        language 
        extension
        children`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({},)
    }
)

/*
* GET FILE TOOL
*/
const getFileTool = tool(async({fileId})=>{
        console.log('ai tool-get_file')

        const file = await getFile({userId,id:fileId})

        if(file && file.type!="file"){
            console.log("Get File Blocked , ID is Folder")
            return JSON.stringify({
            success:false,
            error:"The provided ID belongs to a folder not a File",
            instruction:"Don't Call get_file for folders use the folderId as parentId"
        })
        }

        if(!file){
            console.log("File not Found")
            return JSON.stringify({
                success:false,
                error:"File Not Found"})
        }
    
        return JSON.stringify({
            success:true,
            file:{
                _id:file._id,
                name:file.name,
                type:file.type,
                content:file.content || "",
                language:file.language,
                extension:file.extension,
                parentId:file.parentId
            }
        })
    },
    {
        name:"get_file",
        description:`READ AN EXISTING FILE BEFORE MODIFYING IT
        
        STRICT RULES:
        1. fileId must belongs to a file
        2. NEVER pass a folderId
        3. Use exact fileId from get_tree
        4. Call this before update_file
        5. Do not reread newly created files unless validating or debugging
        6. Don't call this repeatedly for the same file
        
        The Response contains the complete file content`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({
            fileId:z.string()
        })
    }
)

/*
* Create Folder Tool
*/

const createFolderTool = tool(async({name,parentId})=>{
        console.log('ai tool-create_folder')

        const folder = await createFolder({projectId,userId,name,parentId})
    
        return JSON.stringify({
            success:true,
            operation:"folder_created",
            folder:{
                _id:folder._id,
                name:folder.name,
                type:folder.type,
                parentId:folder.parentId
            }
        })
    },
    {
        name:"create_folder",
        description:`CREATE A NEW FOLDER
        RULES:
        1. Create parent folders First
        2. use exact parentId from get_tree
        3. Never create duplicate folders
        4. A folder directly inside another folder must use that folder's ID as parentId
        5. After creation continue with remaining files
        6. donot call get_tree again just to verify the folder`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({
            name:z.string(),
            parentId:z.string().nullable()
        })
    }
)


/*
* Create File Tool
*/
const createFileTool = tool(async({name,parentId,content,language})=>{
        console.log('ai tool-create_file')

        const file = await createFile({projectId,userId,name,parentId,content,
            language:language || "plaintext"})
    
        return JSON.stringify({
            success:true,
            operation:"file_created",
            file:{
                _id:file._id,
                name:file.name,
                type:file.type,
                parentId:file.parentId,
                language:file.language,
                content:file.content
                
            }
        })
    },
    {
        name:"create_file",
        description:`Create a NEW FILE.
        RULES:
        2. Use exact folder ID as parentId.
        1. Use get_tree first when project structure is unknown.
        3. Never create duplicate files.
        4. Send complete file content.
        5. Create folders before files inside them.
        6. Never use terminal commands to create files.
        7. Do not call get file immediately after creating a file.
        8. Continue creating all required files.
        9. Do not stop after creating only one file.
        For a React/Vite project, create ALL required files.`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({
            name:z.string(),
            parentId:z.string().nullable(),
            language:z.string().optional(),
            content:z.string()
        })
    }
)

/* 
* Update File
*/
const updateFileTool = tool(async({name,fileId,content,})=>{
        console.log('ai tool-update_file')

        const file = await updateFile({userId,name,content,id:fileId})
    
        return JSON.stringify({
            success:true,
            operation:"file_updated",
            file:{
                _id:file._id,
                name:file.name,
                type:file.type,
                parentId:file.parentId,
                language:file.language,
                content:file.content
                
            }
        })
    },
    {
        name:"update_file",
        description:`Update an EXISTING FILE.
        RULES:
        1. Call get_file before updating.
        2. fileId must be an actual file ID.
        3. NEVER use a folder ID.
        4. Send the complete updated file content.
        5. Do not update files that do not exist.
        6. After successful update continue with remaining work.
        7. Do not call get_file again unless another modification is needed.`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({
            name:z.string(),
            content:z.string(),
            fileId:z.string()
        })
    }
)

const deleteFileTool = tool(async({fileId})=>{
        console.log('ai tool-delete_file')

        const file = await deleteFile({userId,id:fileId})
    
        return JSON.stringify({
            success:true,
            operation:"file_deleted",
            file:{
                _id:file._id,
            }
        })
    },
    {
        name:"delete_file",
        description:`Delete an EXISTING FILE from the project.
        STRICT RULES:
        1. fileld must belong to an actual file.
        2. NEVER pass a folder ID.
        3. Use the exact file ID from get_tree.
        4. Before deleting, make sure the target is actually a file.
        5. Do not delete a file unless the user's request requires it.
        • 6. Never use terminal commands to delete files.
        7. After successful deletion, continue with the remaining work.
        8. Do not call get_file after deletion.`,
        /**
         * Tells is they need any input parameter to call the tool
         * if don't need leave the brackets empty
         */
        schema:z.object({
            fileId:z.string()
        })
    }
)

    return [getTreeTool,getFileTool,createFolderTool,createFileTool,updateFileTool,deleteFileTool]
}