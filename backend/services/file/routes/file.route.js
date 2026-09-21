import express from "express";

import {createRootFolder,createFolder,createFile,updateFile,deleteFile,getFile,getTree,syncTree} from "../controllers/file.controller.js";
const router = express.Router();


/*
* CREATE ROOT FOLDER ROUTE
* - /api/file/create-root-folder
*/
router.post("/create-root-folder",createRootFolder);

/*
* CREATE FOLDER ROUTE
* - /api/file/create-folder
*/
router.post("/create-folder",createFolder);

/*
* CREATE FILE ROUTE
* - /api/file/create-file
*/
router.post("/create-file", createFile);

/*
* UPDATE FILE BY ID ROUTE
* - /api/file/update/:id
*/
router.patch( "/update/:id", updateFile );

/*
* GET TREE 
* - /api/file/tree/:projectId
*/
router.get( "/tree/:projectId", getTree);

/*
* SYNC PROJECT BY ID
*/
router.post("/sync/:projectId",syncTree);

/*
* GET FILE
* - /api/file/:id
*/
router.get("/:id",getFile);

/*
* DELETE FILE
* - /api/file/:id
*/
router.delete("/:id", deleteFile);


export default router;