import { api } from "../utils/axios.js";

const unwrap = (response) => {
    const data = response?.data;

    if (data?.data !== undefined) return data.data;

    return data;
};

export const createRootFolder = async (projectId, projectName) => {
    try {
        return unwrap(
            await api.post("/api/file/create-root-folder", {
                projectId,
                projectName,
            })
        );
    } catch (error) {
        console.error(
            "Create Root Folder:",
            error.response?.data || error.message
        );
        throw error;
    }
};

export const createFolder = async (projectId, name, parentId) => {
    try {
        return unwrap(
            await api.post("/api/file/create-folder", {
                projectId,
                name,
                parentId,
            })
        );
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
        return unwrap(
            await api.post("/api/file/create-file", {
                projectId,
                name,
                parentId,
                content,
                language,
            })
        );
    } catch (error) {
        console.error(
            "Create File:",
            error.response?.data || error.message
        );
        throw error;
    }
};

export const updateFile = async (id, payload) => {
    try {
        return unwrap(
            await api.patch(`/api/file/update/${id}`, payload)
        );
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
        return unwrap(
            await api.delete(`/api/file/${id}`)
        );
    } catch (error) {
        console.error(
            "Delete File:",
            error.response?.data || error.message
        );
        throw error;
    }
};

export const getFileTree = async (projectId) => {
    try {
        const response = await api.get(
            `/api/file/tree/${projectId}`
        );

        const data = response?.data;

        /*
         * Support the common backend response shapes:
         *
         * [ ... ]
         * { tree: [ ... ] }
         * { files: [ ... ] }
         * { data: [ ... ] }
         * { data: { tree: [ ... ] } }
         * { data: { files: [ ... ] } }
         */
        if (Array.isArray(data)) return data;

        if (Array.isArray(data?.tree)) {
            return data.tree;
        }

        if (Array.isArray(data?.files)) {
            return data.files;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        if (Array.isArray(data?.data?.tree)) {
            return data.data.tree;
        }

        if (Array.isArray(data?.data?.files)) {
            return data.data.files;
        }

        return [];
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
        const response = await api.get(`/api/file/${id}`);

        const data = response?.data;

        /*
         * Normalize:
         *
         * { file: {...} }
         * { data: {...} }
         * { data: { file: {...} } }
         * {...}
         */
        if (data?.file) return data.file;

        if (data?.data?.file) {
            return data.data.file;
        }

        if (data?.data) {
            return data.data;
        }

        return data;
    } catch (error) {
        console.error(
            "Get File:",
            error.response?.data || error.message
        );
        throw error;
    }
};
