
import { createContext, useContext, useState } from "react";

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
    const [openFiles, setOpenFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [viewMode, setViewMode] = useState("code");

    const openFile = (file) => {
        if (!file) return;

        const fileId = file._id || file.id;
        if (!fileId) return;

        setOpenFiles((previous) => {
            const exists = previous.some(
                (item) => (item._id || item.id) === fileId
            );

            return exists ? previous : [...previous, file];
        });

        setActiveFileId(fileId);
        setViewMode("code");
    };

    const activateFile = (fileId) => {
        setActiveFileId(fileId);
        setViewMode("code");
    };

    const closeFile = (fileId) => {
        setOpenFiles((previous) => {
            const index = previous.findIndex(
                (file) => (file._id || file.id) === fileId
            );

            if (index === -1) return previous;

            const remaining = previous.filter(
                (file) => (file._id || file.id) !== fileId
            );

            setActiveFileId((currentActiveId) => {
                if (currentActiveId !== fileId) {
                    return currentActiveId;
                }

                const nextFile =
                    remaining[index] ||
                    remaining[index - 1] ||
                    null;

                return nextFile
                    ? nextFile._id || nextFile.id
                    : null;
            });

            return remaining;
        });
    };

    const clearOpenFiles = () => {
        setOpenFiles([]);
        setActiveFileId(null);
        setViewMode("code");
    };

    const updateOpenFile = (fileId, changes) => {
        setOpenFiles((previous) =>
            previous.map((file) =>
                (file._id || file.id) === fileId
                    ? { ...file, ...changes }
                    : file
            )
        );
    };

    const activeFile =
        openFiles.find(
            (file) => (file._id || file.id) === activeFileId
        ) || null;

    return (
        <WorkspaceContext.Provider
            value={{
                openFiles,
                activeFile,
                activeFileId,
                viewMode,
                setViewMode,
                openFile,
                activateFile,
                closeFile,
                clearOpenFiles,
                updateOpenFile,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);

    if (!context) {
        throw new Error(
            "useWorkspace must be used inside WorkspaceProvider"
        );
    }

    return context;
};
