import express from "express";

import {createRootFolder,createFolder,createFile,updateFile,deleteFile,getFile,getTree} from "../controllers/file.controller.js";

const router = express.Router();

router.post("/create-root-folder",createRootFolder);

router.post("/create-folder",createFolder);

router.post("/create-file", createFile);

router.patch( "/update/:id", updateFile );

router.get( "/tree/:projectId", getTree);

router.get("/:id",getFile);

router.delete("/:id", deleteFile);

export default router;