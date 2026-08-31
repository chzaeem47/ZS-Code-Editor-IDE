import { projectModel } from "../models/project.model.js";
import { redis } from "../../../shared/redis/redis.js";

// ==========================================
// CREATE PROJECT
// ==========================================
export const createProject = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const name = req.body?.name?.trim();
        const description = req.body?.description?.trim() || "";

        if (!name) {
            return res.status(400).json({
                message: "Project name is required.",
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                message: "Project name cannot exceed 100 characters.",
            });
        }

        if (description.length > 500) {
            return res.status(400).json({
                message: "Project description cannot exceed 500 characters.",
            });
        }

        const project = await projectModel.create({
            owner: userID,
            name,
            description,
        });

        await Promise.all([
            redis.del(`projects-${userID}`),
            redis.del(`starred-projects-${userID}`),
        ]);

        return res.status(201).json(project);
    } catch (error) {
        console.error("Create Project Error:", error);

        return res.status(500).json({
            message: "Unable to create project.",
        });
    }
};


// ==========================================
// GET ALL PROJECTS
// ==========================================
export const getProjects = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const key = `projects-${userID}`;

        const cachedProjects = await redis.get(key);

        if (cachedProjects) {
            return res.status(200).json(
                JSON.parse(cachedProjects)
            );
        }

        const projects = await projectModel
            .find({
                owner: userID,
            })
            .sort({
                updatedAt: -1,
            });

        await redis.set(
            key,
            JSON.stringify(projects),
            "EX",
            60 * 60
        );

        return res.status(200).json(projects);
    } catch (error) {
        console.error("Get Projects Error:", error);

        return res.status(500).json({
            message: "Unable to get projects.",
        });
    }
};


// ==========================================
// GET PROJECT BY ID
// ==========================================
export const getProjectById = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const { id } = req.params;

        const project = await projectModel.findOne({
            _id: id,
            owner: userID,
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        project.lastOpenedAt = new Date();

        await project.save();

        await redis.del(`projects-${userID}`);

        return res.status(200).json(project);
    } catch (error) {
        console.error("Get Project By ID Error:", error);

        return res.status(500).json({
            message: "Unable to get project.",
        });
    }
};


// ==========================================
// GET STARRED PROJECTS
// ==========================================
export const getStarredProjects = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const key = `starred-projects-${userID}`;

        const cachedProjects = await redis.get(key);

        if (cachedProjects) {
            return res.status(200).json(
                JSON.parse(cachedProjects)
            );
        }

        const projects = await projectModel
            .find({
                owner: userID,
                starred: true,
            })
            .sort({
                updatedAt: -1,
            });

        await redis.set(
            key,
            JSON.stringify(projects),
            "EX",
            60 * 60
        );

        return res.status(200).json(projects);
    } catch (error) {
        console.error("Get Starred Projects Error:", error);

        return res.status(500).json({
            message: "Unable to get starred projects.",
        });
    }
};


// ==========================================
// TOGGLE STAR
// ==========================================
export const toggleStar = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const { id } = req.params;

        const project = await projectModel.findOne({
            _id: id,
            owner: userID,
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        project.starred = !project.starred;

        await project.save();

        await Promise.all([
            redis.del(`projects-${userID}`),
            redis.del(`starred-projects-${userID}`),
        ]);

        return res.status(200).json(project);
    } catch (error) {
        console.error("Toggle Star Error:", error);

        return res.status(500).json({
            message: "Unable to update project star.",
        });
    }
};


// ==========================================
// DELETE PROJECT
// ==========================================
export const deleteProject = async (req, res) => {
    try {
        const userID = req.headers["x-user-id"];

        if (!userID) {
            return res.status(401).json({
                message: "User ID is required.",
            });
        }

        const { id } = req.params;

        const project = await projectModel.findOneAndDelete({
            _id: id,
            owner: userID,
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        await Promise.all([
            redis.del(`projects-${userID}`),
            redis.del(`starred-projects-${userID}`),
        ]);

        return res.status(200).json(project);
    } catch (error) {
        console.error("Delete Project Error:", error);

        return res.status(500).json({
            message: "Unable to delete project.",
        });
    }
};