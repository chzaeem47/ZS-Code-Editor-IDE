import { api } from "../utils/axios.js";

export const createRootFolder = async (
    projectId,
    projectName
) => {
    try {
        const { data } = await api.post(
            "/api/file/create-root-folder",
            {
                projectId,
                projectName,
            }
        );

        return data;
    } catch (error) {
        console.error(
            "Create Root Folder:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export const createFolder = async (
    projectId,
    name,
    parentId
) => {
    try {
        const { data } = await api.post(
            "/api/file/create-folder",
            {
                projectId,
                name,
                parentId,
            }
        );

        return data;
    } catch (error) {
        console.error(
            "Create Folder:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export const createFile = async (
    projectId,
    name,
    parentId,
    content = "",
    language = "plaintext"
) => {
    try {
        const { data } = await api.post(
            "/api/file/create-file",
            {
                projectId,
                name,
                parentId,
                content,
                language,
            }
        );

        return data;
    } catch (error) {
        console.error(
            "Create File:",
            error.response?.data || error.message
        );

        throw error;
    }
};

export const updateFile = async (
    id,
    payload
) => {
    try {
        const { data } = await api.patch(
            `/api/file/update/${id}`,
            payload
        );

        return data;
    } catch (error) {
        console.error(
            "Update File:",
            error.response?.data || error.message
        );

        throw error;
    }
};

export const deleteFile = async (id) => {
    try {
        const { data } = await api.delete(
            `/api/file/${id}`
        );

        return data;
    } catch (error) {
        console.error(
            "Delete File:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export const getFileTree = async (
    projectId
) => {
    try {
        const { data } = await api.get(
            `/api/file/tree/${projectId}`
        );

        return data;
    } catch (error) {
        console.error(
            "Get File Tree:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export const getFile = async (id) => {
    try {
        const { data } = await api.get(
            `/api/file/${id}`
        );

        return data;
    } catch (error) {
        console.error(
            "Get File:",
            error.response?.data || error.message
        );

        throw error;
    }
};