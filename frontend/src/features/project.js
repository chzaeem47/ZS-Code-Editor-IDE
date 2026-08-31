import { api } from "../utils/axios.js";


// ==========================================
// CREATE PROJECT
// ==========================================
export const createProject = async (name, description) => {
    try {
        const { data } = await api.post(
            "/api/project",
            {
                name,
                description,
            }
        );

        return data;
    } catch (error) {
        console.error(
            "Create Project:",
            error.response?.data || error.message
        );

        return null;
    }
};


// ==========================================
// GET PROJECTS
// ==========================================
export const getProjects = async () => {
    try {
        const { data } = await api.get(
            "/api/project"
        );

        return data;
    } catch (error) {
        console.error(
            "Get Projects:",
            error.response?.data || error.message
        );

        return null;
    }
};


// ==========================================
// GET PROJECT BY ID
// ==========================================
export const getProjectById = async (id) => {
    try {
        const { data } = await api.get(
            `/api/project/${id}`
        );

        return data;
    } catch (error) {
        console.error(
            "Get Project By ID:",
            error.response?.data || error.message
        );

        return null;
    }
};


// ==========================================
// GET STARRED PROJECTS
// ==========================================
export const getStarredProject = async () => {
    try {
        const { data } = await api.get(
            "/api/project/starred"
        );

        return data;
    } catch (error) {
        console.error(
            "Get Starred Projects:",
            error.response?.data || error.message
        );

        return null;
    }
};


// ==========================================
// TOGGLE STAR
// ==========================================
export const toggleStar = async (id) => {
    try {
        const { data } = await api.patch(
            `/api/project/${id}`
        );

        return data;
    } catch (error) {
        console.error(
            "Toggle Star:",
            error.response?.data || error.message
        );

        return null;
    }
};


// ==========================================
// DELETE PROJECT
// ==========================================
export const deleteProject = async (id) => {
    try {
        const { data } = await api.delete(
            `/api/project/${id}`
        );

        return data;
    } catch (error) {
        console.error(
            "Delete Project:",
            error.response?.data || error.message
        );

        return null;
    }
};