import mongoose from "mongoose";
import { fileModel } from "../models/file.model.js";


const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

export const createRootFolder = async (req, res) => {
    try {
        const { projectId, projectName } = req.body;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!projectId || !projectName?.trim()) {
            return res.status(400).json({
                message: "Project ID and project name are required.",
            });
        }

        if (!isValidObjectId(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID.",
            });
        }

        const existingRootFolder = await fileModel.findOne({
            projectId,
            owner: userId,
            parentId: null,
            type: "folder",
            isDeleted: false,
        });

        if (existingRootFolder) {
            return res.status(409).json({
                message: "Root folder already exists.",
            });
        }

        const rootFolder = await fileModel.create({
            owner: userId,
            projectId,
            name: projectName.trim(),
            type: "folder",
            parentId: null,
        });

        return res.status(201).json(rootFolder);
    } catch (error) {
        console.error("Create Root Folder Error:", error);

        return res.status(500).json({
            message: "Unable to create root folder.",
        });
    }
};


export const createFolder = async (req, res) => {
    try {
        const { projectId, name, parentId } = req.body;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!projectId || !name?.trim() || !parentId) {
            return res.status(400).json({
                message: "Project ID, folder name and parent ID are required.",
            });
        }

        if (
            !isValidObjectId(projectId) ||
            !isValidObjectId(parentId)
        ) {
            return res.status(400).json({
                message: "Invalid project or parent ID.",
            });
        }

        const folderName = name.trim();

        const parentFolder = await fileModel.findOne({
            _id: parentId,
            projectId,
            owner: userId,
            type: "folder",
            isDeleted: false,
        });

        if (!parentFolder) {
            return res.status(404).json({
                message: "Parent folder not found.",
            });
        }

        const existingFolder = await fileModel.findOne({
            projectId,
            owner: userId,
            name: folderName,
            parentId,
            type: "folder",
            isDeleted: false,
        });

        if (existingFolder) {
            return res.status(409).json({
                message: "Folder already exists in this location.",
            });
        }

        const folder = await fileModel.create({
            owner: userId,
            projectId,
            name: folderName,
            type: "folder",
            parentId,
        });

        return res.status(201).json(folder);
    } catch (error) {
        console.error("Create Folder Error:", error);

        return res.status(500).json({
            message: "Unable to create folder.",
        });
    }
};


export const createFile = async (req, res) => {
    try {
        const {
            projectId,
            name,
            parentId,
            content = "",
            language = "plaintext",
        } = req.body;

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!projectId || !name?.trim() || !parentId) {
            return res.status(400).json({
                message: "Project ID, file name and parent ID are required.",
            });
        }

        if (
            !isValidObjectId(projectId) ||
            !isValidObjectId(parentId)
        ) {
            return res.status(400).json({
                message: "Invalid project or parent ID.",
            });
        }

        const fileName = name.trim();

        const parentFolder = await fileModel.findOne({
            _id: parentId,
            projectId,
            owner: userId,
            type: "folder",
            isDeleted: false,
        });

        if (!parentFolder) {
            return res.status(404).json({
                message: "Parent folder not found.",
            });
        }

        const existingFile = await fileModel.findOne({
            projectId,
            owner: userId,
            name: fileName,
            parentId,
            type: "file",
            isDeleted: false,
        });

        if (existingFile) {
            return res.status(409).json({
                message: "File already exists in this location.",
            });
        }

        const extension = fileName.includes(".")
            ? fileName.split(".").pop().toLowerCase()
            : "";

        const file = await fileModel.create({
            owner: userId,
            projectId,
            name: fileName,
            type: "file",
            language,
            extension,
            content,
            size: content.length,
            parentId,
        });

        return res.status(201).json(file);
    } catch (error) {
        console.error("Create File Error:", error);

        return res.status(500).json({
            message: "Unable to create file.",
        });
    }
};


export const updateFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const { name, content, language } = req.body;

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid file or folder ID.",
            });
        }

        const file = await fileModel.findOne({
            _id: req.params.id,
            owner: userId,
            isDeleted: false,
        });

        if (!file) {
            return res.status(404).json({
                message: "File or folder not found.",
            });
        }


        if (
            file.type === "folder" &&
            file.parentId === null &&
            name !== undefined
        ) {
            return res.status(403).json({
                message: "The project root folder cannot be renamed.",
            });
        }

        if (name !== undefined) {
            const newName = name.trim();

            if (!newName) {
                return res.status(400).json({
                    message: "Name cannot be empty.",
                });
            }

            const duplicate = await fileModel.findOne({
                _id: { $ne: file._id },
                owner: userId,
                projectId: file.projectId,
                parentId: file.parentId,
                name: newName,
                isDeleted: false,
            });

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "A file or folder with this name already exists here.",
                });
            }

            file.name = newName;

            if (file.type === "file") {
                file.extension = newName.includes(".")
                    ? newName.split(".").pop().toLowerCase()
                    : "";
            }
        }

        if (
            content !== undefined &&
            file.type === "file"
        ) {
            file.content = content;
            file.size = content.length;
        }

        if (
            language !== undefined &&
            file.type === "file"
        ) {
            file.language = language;
        }

        await file.save();

        return res.status(200).json(file);
    } catch (error) {
        console.error("Update File Error:", error);

        return res.status(500).json({
            message: "Unable to update file or folder.",
        });
    }
};


export const deleteFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid file or folder ID.",
            });
        }

        const file = await fileModel.findOne({
            _id: req.params.id,
            owner: userId,
            isDeleted: false,
        });

        if (!file) {
            return res.status(404).json({
                message: "File or folder not found.",
            });
        }

        if (
            file.type === "folder" &&
            file.parentId === null
        ) {
            return res.status(403).json({
                message: "The project root folder cannot be deleted.",
            });
        }

        if (file.type === "folder") {
            const descendants = await getDescendantIds(
                file._id
            );

            if (descendants.length > 0) {
                await fileModel.updateMany(
                    {
                        _id: { $in: descendants },
                        owner: userId,
                    },
                    {
                        $set: {
                            isDeleted: true,
                        },
                    }
                );
            }
        }

        file.isDeleted = true;

        await file.save();

        return res.status(200).json(file);
    } catch (error) {
        console.error("Delete File Error:", error);

        return res.status(500).json({
            message: "Unable to delete file or folder.",
        });
    }
};


export const getFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid file or folder ID.",
            });
        }

        const file = await fileModel.findOne({
            _id: req.params.id,
            owner: userId,
            isDeleted: false,
        });

        if (!file) {
            return res.status(404).json({
                message: "File or folder not found.",
            });
        }

        return res.status(200).json(file);
    } catch (error) {
        console.error("Get File Error:", error);

        return res.status(500).json({
            message: "Unable to get file or folder.",
        });
    }
};


export const getTree = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { projectId } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        if (!projectId) {
            return res.status(400).json({
                message: "Project ID is required.",
            });
        }

        if (!isValidObjectId(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID.",
            });
        }

        const files = await fileModel
            .find({
                projectId,
                owner: userId,
                isDeleted: false,
            })
            .sort({
                type: -1,
                name: 1,
            });

        const tree = buildTree(files);

        return res.status(200).json(tree);
    } catch (error) {
        console.error("Get Tree Error:", error);

        return res.status(500).json({
            message: "Unable to get file tree.",
        });
    }
};


const buildTree = (files) => {
    const map = {};
    const tree = [];

    files.forEach((file) => {
        map[file._id.toString()] = {
            ...file.toObject(),
            children: [],
        };
    });

    files.forEach((file) => {
        const id = file._id.toString();

        if (file.parentId) {
            const parent = map[file.parentId.toString()];

            if (parent) {
                parent.children.push(map[id]);
            }
        } else {
            tree.push(map[id]);
        }
    });

    const sortChildren = (nodes) => {
        nodes.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }

            return a.name.localeCompare(
                b.name,
                undefined,
                {
                    sensitivity: "base",
                }
            );
        });

        nodes.forEach((node) => {
            if (node.children?.length) {
                sortChildren(node.children);
            }
        });
    };

    sortChildren(tree);

    return tree;
};


const getDescendantIds = async (parentId) => {
    const descendants = [];
    const queue = [parentId];

    while (queue.length > 0) {
        const currentParentId = queue.shift();

        const children = await fileModel.find({
            parentId: currentParentId,
            isDeleted: false,
        });

        for (const child of children) {
            descendants.push(child._id);

            if (child.type === "folder") {
                queue.push(child._id);
            }
        }
    }

    return descendants;
};