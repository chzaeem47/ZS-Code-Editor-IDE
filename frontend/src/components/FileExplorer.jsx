import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    FaFolder,
    FaTrash,
    FaTimes,
    FaStar,
    FaArrowLeft,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";

import {
    createProject,
    deleteProject,
    getProjects,
    getStarredProject,
    toggleStar,
} from "../features/project";

import {
    createRootFolder,
    getFileTree,
    getFile,
} from "../features/file";

import ProjectRow from "./ProjectRow";
import CreateProjectModal from "./CreateProjectModal";
import FileTree from "./FileTree";

const FileExplorer = ({
    isOpen,
    mode,
}) => {
    const { isDark } = useTheme();
    const { openFile, clearOpenFiles } = useWorkspace();


    const [projects, setProjects] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [
        selectionMode,
        setSelectionMode,
    ] = useState(false);

    const [
        selectedProjects,
        setSelectedProjects,
    ] = useState([]);

    const [
        showCreateModal,
        setShowCreateModal,
    ] = useState(false);

    const [
        openedProject,
        setOpenedProject,
    ] = useState(null);

    const [
        fileTree,
        setFileTree,
    ] = useState([]);

    const [
        treeLoading,
        setTreeLoading,
    ] = useState(false);


    const fetchProjects =
        useCallback(async () => {
            if (!mode) {
                return;
            }

            setLoading(true);

            try {
                const result =
                    mode === "starred"
                        ? await getStarredProject()
                        : await getProjects();

                setProjects(
                    Array.isArray(result)
                        ? result
                        : []
                );
            } catch (error) {
                console.error(
                    "Fetch projects error:",
                    error
                );

                toast.error(
                    "Unable to load projects."
                );
            } finally {
                setLoading(false);
            }
        }, [mode]);


    const fetchFileTree =
        useCallback(async () => {
            if (!openedProject?._id) {
                setFileTree([]);
                return;
            }

            setTreeLoading(true);

            try {
                const tree =
                    await getFileTree(
                        openedProject._id
                    );

                setFileTree(
                    Array.isArray(tree)
                        ? tree
                        : []
                );
            } catch (error) {
                console.error(
                    "Fetch file tree error:",
                    error
                );

                setFileTree([]);

                toast.error(
                    error?.response
                        ?.data
                        ?.message ||
                    "Unable to load project files."
                );
            } finally {
                setTreeLoading(false);
            }
        }, [
            openedProject?._id,
        ]);

    useEffect(() => {
        if (!isOpen || !mode) {
            return;
        }

        setSelectionMode(false);
        setSelectedProjects([]);
        setOpenedProject(null);
        setFileTree([]);

        fetchProjects();
    }, [
        isOpen,
        mode,
        fetchProjects,
    ]);


    useEffect(() => {
        if (!openedProject?._id) {
            setFileTree([]);
            return;
        }

        fetchFileTree();
    }, [
        openedProject?._id,
        fetchFileTree,
    ]);


    const handleOpenProject = (
        project
    ) => {
        if (selectionMode) {
            return;
        }

        clearOpenFiles();
        setOpenedProject(project);
    };

    const handleOpenFile = async (node) => {
        if (!node || node.type !== "file") {
            return;
        }

        try {
            const file = await getFile(
                node._id || node.id
            );

            if (file) {
                openFile(file);
            }
        } catch (error) {
            console.error(
                "Open file error:",
                error
            );

            toast.error(
                error?.response?.data
                    ?.message ||
                "Unable to open file."
            );
        }
    };


    const handleBackToProjects = () => {
        clearOpenFiles();
        setOpenedProject(null);
        setFileTree([]);
    };

    const handleCreateProject =
        async (
            name,
            description
        ) => {
            try {
                const project =
                    await createProject(
                        name,
                        description
                    );

                if (!project) {
                    toast.error(
                        "Project creation failed."
                    );

                    return false;
                }

                try {
                    await createRootFolder(
                        project._id,
                        project.name
                    );
                } catch (rootError) {
                    console.error(
                        "Root folder creation failed:",
                        rootError
                    );

                    await deleteProject(
                        project._id
                    );

                    toast.error(
                        "Project created, but root folder could not be created."
                    );

                    return false;
                }

                toast.success(
                    `"${project.name}" created successfully.`
                );

                if (mode === "files") {
                    setProjects(
                        (previous) => [
                            project,
                            ...previous,
                        ]
                    );
                } else {
                    await fetchProjects();
                }

                return true;
            } catch (error) {
                console.error(
                    "Create project error:",
                    error
                );

                toast.error(
                    error?.response
                        ?.data
                        ?.message ||
                    "Unable to create project."
                );

                return false;
            }
        };


    const handleToggleStar = async (
        projectId
    ) => {
        const updatedProject =
            await toggleStar(
                projectId
            );

        if (!updatedProject) {
            toast.error(
                "Unable to update project."
            );

            return;
        }

        if (mode === "starred") {
            setProjects(
                (previous) =>
                    updatedProject.starred
                        ? previous.map(
                            (project) =>
                                project._id ===
                                    updatedProject._id
                                    ? updatedProject
                                    : project
                        )
                        : previous.filter(
                            (project) =>
                                project._id !==
                                updatedProject._id
                        )
            );
        } else {
            setProjects(
                (previous) =>
                    previous.map(
                        (project) =>
                            project._id ===
                                updatedProject._id
                                ? updatedProject
                                : project
                    )
            );
        }

        if (
            openedProject &&
            openedProject._id ===
                updatedProject._id
        ) {
            setOpenedProject(
                updatedProject
            );
        }

        if (updatedProject.starred) {
            toast.success(
                `"${updatedProject.name}" starred.`
            );
        } else {
            toast.info(
                `"${updatedProject.name}" removed from starred.`
            );
        }
    };


    const handleSelectionChange =
        (projectId) => {
            setSelectedProjects(
                (previous) =>
                    previous.includes(
                        projectId
                    )
                        ? previous.filter(
                            (id) =>
                                id !== projectId
                        )
                        : [
                            ...previous,
                            projectId,
                        ]
            );
        };

    const handleDeleteSelected =
        async () => {
            if (
                !selectedProjects.length
            ) {
                toast.info(
                    "Select at least one project."
                );

                return;
            }

            const confirmed =
                window.confirm(
                    `Delete ${selectedProjects.length} selected project${
                        selectedProjects.length >
                        1
                            ? "s"
                            : ""
                    }?`
                );

            if (!confirmed) {
                return;
            }

            try {
                const results =
                    await Promise.all(
                        selectedProjects.map(
                            (id) =>
                                deleteProject(
                                    id
                                )
                        )
                    );

                const successful =
                    results.filter(
                        Boolean
                    ).length;

                const failed =
                    results.length -
                    successful;

                if (successful > 0) {
                    toast.success(
                        `${successful} project${
                            successful >
                            1
                                ? "s"
                                : ""
                        } deleted successfully.`
                    );
                }

                if (failed > 0) {
                    toast.error(
                        `${failed} project${
                            failed >
                            1
                                ? "s"
                                : ""
                        } could not be deleted.`
                    );
                }

                if (
                    openedProject &&
                    selectedProjects.includes(
                        openedProject._id
                    )
                ) {
                    setOpenedProject(null);
                    setFileTree([]);
                }

                setSelectedProjects([]);
                setSelectionMode(false);

                await fetchProjects();
            } catch (error) {
                console.error(
                    "Delete selected projects error:",
                    error
                );

                toast.error(
                    "Unable to delete selected projects."
                );
            }
        };


    const handleCancelSelection =
        () => {
            setSelectionMode(false);
            setSelectedProjects([]);
        };


    const panelTitle =
        mode === "starred"
            ? "Starred Projects"
            : "Projects";

 
    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{
                            x: -350,
                            opacity: 0,
                        }}
                        animate={{
                            x: 0,
                            opacity: 1,
                        }}
                        exit={{
                            x: -350,
                            opacity: 0,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 28,
                        }}
                        className={`fixed bottom-3 left-[76px] top-[69px] z-30 flex w-[350px] flex-col overflow-hidden rounded-2xl border effect-less backdrop-blur-3xl ${
                            isDark
                                ? "border-slate-800/80 bg-slate-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                                : "border-black/10 bg-white/90 shadow-[0_20px_20px_rgba(0,0,0,0.18)]"
                        }`}
                    >

                        {!openedProject ? (
                            <div className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {mode ===
                                        "starred" ? (
                                            <FaStar className="text-[15px] text-yellow-400" />
                                        ) : (
                                            <FaFolder
                                                className={`text-[20px] ${
                                                    isDark
                                                        ? "text-cyan-400"
                                                        : "text-[#1227b2]"
                                                }`}
                                            />
                                        )}

                                        <h2
                                            className={`font-cherry text-lg tracking-wider ${
                                                isDark
                                                    ? "text-white"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            {
                                                panelTitle
                                            }
                                        </h2>
                                    </div>

                                    {selectionMode && (
                                        <button
                                            type="button"
                                            onClick={
                                                handleCancelSelection
                                            }
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                isDark
                                                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                                                    : "text-slate-400 hover:bg-black/5 hover:text-slate-700"
                                            }`}
                                            aria-label="Cancel selection"
                                        >
                                            <FaTimes className="text-xs" />
                                        </button>
                                    )}
                                </div>

                                {/* HEADER ACTIONS */}

                                {!selectionMode && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCreateModal(
                                                    true
                                                )
                                            }
                                            className="effect-3d flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-white/30 bg-gradient-to-b from-[#0b165d] via-[#1227b2]/80 to-[#0641e2] px-3 font-cookie text-2xl tracking-widest text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                                        >
                                            Create
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectionMode(
                                                    true
                                                )
                                            }
                                            className="effect-3d flex h-10 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#0b165d] via-[#1227b2]/80 to-[#0641e2] px-4 font-cookie text-2xl tracking-widest text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                                        >
                                            Select
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* OPENED PROJECT HEADER */
                            <div className="flex h-10 shrink-0 items-center px-2">
                                <button
                                    type="button"
                                    onClick={
                                        handleBackToProjects
                                    }
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                                        isDark
                                            ? "text-white/50 hover:bg-white/10 hover:text-white"
                                            : "text-slate-400 hover:bg-black/5 hover:text-slate-800"
                                    }`}
                                    aria-label="Back to projects"
                                >
                                    <FaArrowLeft className="text-xs" />
                                </button>
                            </div>
                        )}

                        {!openedProject && (
                            <div
                                className={`mx-4 h-px ${
                                    isDark
                                        ? "bg-white/10"
                                        : "bg-black/10"
                                }`}
                            />
                        )}

                        <div
                            className={`min-h-0 flex-1 overflow-y-auto ${
                                openedProject
                                    ? "px-3 py-1"
                                    : "p-3"
                            }`}
                        >
                            {openedProject ? (
                                <>
                                    {treeLoading ? (
                                        <div
                                            className={`px-1 py-2 text-sm ${
                                                isDark
                                                    ? "text-white/35"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            Loading...
                                        </div>
                                    ) : (
                                        <FileTree
                                            tree={
                                                fileTree
                                            }
                                            projectId={
                                                openedProject._id
                                            }
                                            isDark={
                                                isDark
                                            }
                                            onRefresh={
                                                fetchFileTree
                                            }
                                            onOpenFile={
                                                handleOpenFile
                                            }
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    {loading ? (
                                        <div
                                            className={`flex h-full items-center justify-center font-cookie text-2xl tracking-widest ${
                                                isDark
                                                    ? "text-white/45"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            Loading projects...
                                        </div>
                                    ) : projects.length ===
                                      0 ? (
                                        <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                                            <FaFolder
                                                className={`mb-3 text-3xl ${
                                                    isDark
                                                        ? "text-white/10"
                                                        : "text-slate-300"
                                                }`}
                                            />

                                            <p
                                                className={`font-serif text-sm ${
                                                    isDark
                                                        ? "text-white/40"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {mode ===
                                                "starred"
                                                    ? "No starred projects yet"
                                                    : "No projects yet"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {projects.map(
                                                (
                                                    project
                                                ) => (
                                                    <ProjectRow
                                                        key={
                                                            project._id
                                                        }
                                                        project={
                                                            project
                                                        }
                                                        isDark={
                                                            isDark
                                                        }
                                                        selectionMode={
                                                            selectionMode
                                                        }
                                                        selected={selectedProjects.includes(
                                                            project._id
                                                        )}
                                                        onSelect={
                                                            handleSelectionChange
                                                        }
                                                        onToggleStar={
                                                            handleToggleStar
                                                        }
                                                        onOpen={
                                                            handleOpenProject
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {selectionMode &&
                            !openedProject && (
                                <div
                                    className={`border-t p-3 ${
                                        isDark
                                            ? "border-white/10"
                                            : "border-black/10"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            handleDeleteSelected
                                        }
                                        disabled={
                                            selectedProjects.length ===
                                            0
                                        }
                                        className="effect-3d flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-300/30 bg-gradient-to-r from-red-700 via-red-600 to-red-700 font-serif text-sm font-semibold text-white shadow-[0_8px_25px_-10px_rgba(239,68,68,0.6)] transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FaTrash className="text-xs" />

                                        Delete Selected

                                        {selectedProjects.length >
                                            0 &&
                                            ` (${selectedProjects.length})`}
                                    </button>
                                </div>
                            )}
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateProjectModal
                isOpen={
                    showCreateModal
                }
                isDark={isDark}
                onClose={() =>
                    setShowCreateModal(
                        false
                    )
                }
                onCreate={
                    handleCreateProject
                }
            />
        </>
    );
};

export default FileExplorer;