import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
    FaChevronDown,
    FaChevronRight,
    FaFolder,
    FaFolderOpen,
    FaPlus,
    FaFolderPlus,
    FaTrash,
    FaPen,
    FaRoute,
    FaDatabase,
    FaCogs,
    FaShieldAlt,
    FaServer,
    FaWrench,
    FaLayerGroup,
    FaFileCode,
    FaFileAlt,
    FaSlidersH,
    FaCodeBranch,
} from "react-icons/fa";

import {
    SiJavascript,
    SiTypescript,
    SiReact,
    SiJson,
    SiCss,
    SiHtml5,
    SiMarkdown,
    SiGit,
} from "react-icons/si";

import {
    createFolder,
    createFile,
    updateFile,
    deleteFile,
} from "../features/file";



const getFolderVisual = (name = "", isOpen = false) => {
    const key = name.toLowerCase().trim();

    const folderMap = {
        src: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-green-400",
        },

        routes: {
            icon: FaRoute,
            color: "text-green-400",
        },

        route: {
            icon: FaRoute,
            color: "text-green-400",
        },

        models: {
            icon: FaDatabase,
            color: "text-red-400",
        },

        model: {
            icon: FaDatabase,
            color: "text-red-400",
        },

        db: {
            icon: FaDatabase,
            color: "text-yellow-400",
        },

        database: {
            icon: FaDatabase,
            color: "text-yellow-400",
        },

        controllers: {
            icon: FaCogs,
            color: "text-yellow-400",
        },

        controller: {
            icon: FaCogs,
            color: "text-yellow-400",
        },

        middleware: {
            icon: FaShieldAlt,
            color: "text-orange-400",
        },

        middlewares: {
            icon: FaShieldAlt,
            color: "text-orange-400",
        },

        services: {
            icon: FaServer,
            color: "text-sky-400",
        },

        service: {
            icon: FaServer,
            color: "text-sky-400",
        },

        utils: {
            icon: FaWrench,
            color: "text-green-400",
        },

        utility: {
            icon: FaWrench,
            color: "text-green-400",
        },

        utilities: {
            icon: FaWrench,
            color: "text-green-400",
        },

        components: {
            icon: FaLayerGroup,
            color: "text-purple-400",
        },

        component: {
            icon: FaLayerGroup,
            color: "text-purple-400",
        },

        pages: {
            icon: FaLayerGroup,
            color: "text-purple-400",
        },

        hooks: {
            icon: FaWrench,
            color: "text-purple-400",
        },

        config: {
            icon: FaWrench,
            color: "text-cyan-400",
        },

        configs: {
            icon: FaWrench,
            color: "text-cyan-400",
        },

        public: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-blue-400",
        },

        assets: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-orange-400",
        },

        auth: {
            icon: FaShieldAlt,
            color: "text-orange-400",
        },

        gateway: {
            icon: FaServer,
            color: "text-sky-400",
        },

        node_modules: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-lime-400",
        },

        tests: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-purple-400",
        },

        test: {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-purple-400",
        },
    };

    return (
        folderMap[key] || {
            icon: isOpen ? FaFolderOpen : FaFolder,
            color: "text-sky-300",
        }
    );
};


const getFileVisual = (name = "") => {
    const lowerName = name.toLowerCase();

    /* JavaScript */

    if (
        lowerName.endsWith(".js") ||
        lowerName.endsWith(".mjs") ||
        lowerName.endsWith(".cjs")
    ) {
        return {
            icon: SiJavascript,
            color: "text-yellow-400",
        };
    }

    /* TypeScript */

    if (
        lowerName.endsWith(".ts") ||
        lowerName.endsWith(".mts") ||
        lowerName.endsWith(".cts")
    ) {
        return {
            icon: SiTypescript,
            color: "text-blue-400",
        };
    }

    /* React */

    if (
        lowerName.endsWith(".jsx") ||
        lowerName.endsWith(".tsx")
    ) {
        return {
            icon: SiReact,
            color: "text-cyan-400",
        };
    }

    /* JSON */

    if (lowerName.endsWith(".json")) {
        return {
            icon: SiJson,
            color: "text-yellow-300",
        };
    }

    /* CSS */

    if (
        lowerName.endsWith(".css") ||
        lowerName.endsWith(".scss") ||
        lowerName.endsWith(".sass") ||
        lowerName.endsWith(".less")
    ) {
        return {
            icon: SiCss,
            color: "text-sky-400",
        };
    }

    /* HTML */

    if (
        lowerName.endsWith(".html") ||
        lowerName.endsWith(".htm")
    ) {
        return {
            icon: SiHtml5,
            color: "text-orange-500",
        };
    }

    /* Markdown */

    if (
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".mdx")
    ) {
        return {
            icon: SiMarkdown,
            color: "text-blue-300",
        };
    }

    /* Gitignore */

    if (lowerName === ".gitignore") {
        return {
            icon: SiGit,
            color: "text-red-400",
        };
    }

    /* Environment files */

    if (
        lowerName === ".env" ||
        lowerName.startsWith(".env.")
    ) {
        return {
            icon: FaSlidersH,
            color: "text-yellow-400",
        };
    }

    /* Package files */

    if (
        lowerName === "package.json" ||
        lowerName === "package-lock.json"
    ) {
        return {
            icon: FaFileCode,
            color: "text-lime-400",
        };
    }

    /* Docker */

    if (
        lowerName === "dockerfile" ||
        lowerName.startsWith("dockerfile.")
    ) {
        return {
            icon: FaServer,
            color: "text-sky-400",
        };
    }

    /* YAML */

    if (
        lowerName.endsWith(".yml") ||
        lowerName.endsWith(".yaml")
    ) {
        return {
            icon: FaSlidersH,
            color: "text-red-300",
        };
    }

    /* XML */

    if (
        lowerName.endsWith(".xml") ||
        lowerName.endsWith(".svg")
    ) {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* Text */

    if (
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".log")
    ) {
        return {
            icon: FaFileAlt,
            color: "text-gray-400",
        };
    }

    /* Default */

    return {
        icon: FaFileCode,
        color: "text-gray-300",
    };
};


const ContextMenu = ({
    menu,
    isDark,
    onClose,
    onAction,
}) => {
    const menuRef = useRef(null);

    const [position, setPosition] = useState({
        x: menu.x,
        y: menu.y,
    });

    useEffect(() => {
        const updatePosition = () => {
            if (!menuRef.current) return;

            const rect =
                menuRef.current.getBoundingClientRect();

            let x = menu.x;
            let y = menu.y;

            const padding = 8;

            /* Keep menu inside right edge */

            if (
                x + rect.width >
                window.innerWidth - padding
            ) {
                x =
                    window.innerWidth -
                    rect.width -
                    padding;
            }

            /* Keep menu inside bottom edge */

            if (
                y + rect.height >
                window.innerHeight - padding
            ) {
                y =
                    window.innerHeight -
                    rect.height -
                    padding;
            }

            /* Never go outside top/left */

            x = Math.max(padding, x);
            y = Math.max(padding, y);

            setPosition({
                x,
                y,
            });
        };

        requestAnimationFrame(updatePosition);
    }, [menu.x, menu.y]);

    useEffect(() => {
        const closeOnOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target
                )
            ) {
                onClose();
            }
        };

        const closeOnScroll = () => {
            onClose();
        };

        const closeOnResize = () => {
            onClose();
        };

        document.addEventListener(
            "mousedown",
            closeOnOutside
        );

        window.addEventListener(
            "scroll",
            closeOnScroll,
            true
        );

        window.addEventListener(
            "resize",
            closeOnResize
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                closeOnOutside
            );

            window.removeEventListener(
                "scroll",
                closeOnScroll,
                true
            );

            window.removeEventListener(
                "resize",
                closeOnResize
            );
        };
    }, [onClose]);

    const items = [
        {
            label: "Create Folder",
            icon: FaFolderPlus,
            action: "create-folder",
            visible:
                menu.node?.type === "folder",
        },

        {
            label: "Create File",
            icon: FaPlus,
            action: "create-file",
            visible:
                menu.node?.type === "folder",
        },

        {
            label: "Rename",
            icon: FaPen,
            action: "rename",
            visible: !menu.isRoot,
        },

        {
            label: "Delete",
            icon: FaTrash,
            action: "delete",
            visible: !menu.isRoot,
            danger: true,
        },
    ];

    const visibleItems =
        items.filter(
            (item) => item.visible
        );

    return createPortal(
        <div
            ref={menuRef}
            className={`
                fixed
                z-[999999]
                min-w-[185px]
                overflow-hidden
                rounded-md
                border
                shadow-2xl
                backdrop-blur-md
                select-none
                ${
                    isDark
                        ? "border-gray-700 bg-[#181818]/98 text-gray-200"
                        : "border-gray-300 bg-white/98 text-gray-800"
                }
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onContextMenu={(event) =>
                event.preventDefault()
            }
        >
            {visibleItems.map(
                (item, index) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.action}
                            type="button"
                            onClick={() =>
                                onAction(
                                    item.action
                                )
                            }
                            className={`
                                flex
                                w-full
                                items-center
                                gap-3
                                px-3
                                py-2
                                text-left
                                text-[13px]
                                transition-colors
                                ${
                                    item.danger
                                        ? "text-red-400 hover:bg-red-500/10"
                                        : isDark
                                        ? "hover:bg-[#2a2d2e]"
                                        : "hover:bg-gray-100"
                                }
                                ${
                                    index ===
                                    visibleItems.length -
                                        1
                                        ? ""
                                        : isDark
                                        ? "border-b border-gray-800"
                                        : "border-b border-gray-200"
                                }
                            `}
                        >
                            <Icon
                                className={
                                    item.danger
                                        ? "text-red-400"
                                        : isDark
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }
                                size={14}
                            />

                            <span>
                                {item.label}
                            </span>
                        </button>
                    );
                }
            )}
        </div>,
        document.body
    );
};

const FileTree = ({
    tree = [],
    projectId,
    isDark,
    onRefresh,
    onOpenFile,
}) => {
    const [expanded, setExpanded] =
        useState({});

    const [contextMenu, setContextMenu] =
        useState(null);

    const [busy, setBusy] =
        useState(false);

    const getNodeId = (node) =>
        node?._id || node?.id;

    const isRootNode = (node) =>
        node?.type === "folder" &&
        node?.parentId === null;

    const getCreateParentId = (node) => {
        if (!node) return null;

        if (node.type === "folder") {
            return getNodeId(node);
        }

        return node.parentId || null;
    };


    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const toggleFolder = (
        nodeId
    ) => {
        setExpanded((prev) => ({
            ...prev,
            [nodeId]:
                !prev[nodeId],
        }));
    };


    const handleCreateFolder = async (
        node
    ) => {
        if (!node) return;

        const parentId =
            getCreateParentId(node);

        if (!parentId) {
            return;
        }

        const folderName =
            window.prompt(
                "Enter folder name:"
            );

        if (
            !folderName ||
            !folderName.trim()
        ) {
            return;
        }

        try {
            setBusy(true);

            await createFolder(
                projectId,
                folderName.trim(),
                parentId
            );

            setExpanded((prev) => ({
                ...prev,
                [getNodeId(node)]:
                    true,
            }));

            closeContextMenu();

            await onRefresh();
        } catch (error) {
            console.error(
                "Create folder failed:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to create folder."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleCreateFile = async (
        node
    ) => {
        if (!node) return;

        const parentId =
            getCreateParentId(node);

        if (!parentId) {
            return;
        }

        const fileName =
            window.prompt(
                "Enter file name:"
            );

        if (
            !fileName ||
            !fileName.trim()
        ) {
            return;
        }

        try {
            setBusy(true);

            await createFile(
                projectId,
                fileName.trim(),
                parentId
            );

            setExpanded((prev) => ({
                ...prev,
                [getNodeId(node)]:
                    true,
            }));

            closeContextMenu();

            await onRefresh();
        } catch (error) {
            console.error(
                "Create file failed:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to create file."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleRename = async (
        node
    ) => {
        if (!node) return;

        if (isRootNode(node)) {
            return;
        }

        const newName =
            window.prompt(
                "Enter new name:",
                node.name
            );

        if (
            !newName ||
            !newName.trim() ||
            newName.trim() ===
                node.name
        ) {
            return;
        }

        try {
            setBusy(true);

            await updateFile(
                getNodeId(node),
                {
                    name: newName.trim(),
                }
            );

            closeContextMenu();

            await onRefresh();
        } catch (error) {
            console.error(
                "Rename failed:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to rename."
            );
        } finally {
            setBusy(false);
        }
    };


    const handleDelete = async (
        node
    ) => {
        if (!node) return;

        if (isRootNode(node)) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete "${node.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setBusy(true);

            await deleteFile(
                getNodeId(node)
            );

            closeContextMenu();

            await onRefresh();
        } catch (error) {
            console.error(
                "Delete failed:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to delete."
            );
        } finally {
            setBusy(false);
        }
    };


    const handleContextAction = async (
        action
    ) => {
        if (!contextMenu?.node) {
            return;
        }

        const node =
            contextMenu.node;

        switch (action) {
            case "create-folder":
                await handleCreateFolder(
                    node
                );
                break;

            case "create-file":
                await handleCreateFile(
                    node
                );
                break;

            case "rename":
                await handleRename(
                    node
                );
                break;

            case "delete":
                await handleDelete(
                    node
                );
                break;

            default:
                break;
        }
    };


    const handleContextMenu = (
        event,
        node
    ) => {
        event.preventDefault();
        event.stopPropagation();

        const root =
            isRootNode(node);

        setContextMenu({
            node,
            isRoot: root,

            /*
             * Use the exact mouse coordinates.
             * ContextMenu then clamps itself
             * inside the viewport.
             */
            x: event.clientX,
            y: event.clientY,
        });
    };


    const renderNode = (
        node,
        depth = 0
    ) => {
        const nodeId =
            getNodeId(node);

        const isFolder =
            node.type === "folder";

        const isRoot =
            isRootNode(node);

        const isExpanded =
            !!expanded[nodeId];

        const hasChildren =
            isFolder &&
            Array.isArray(
                node.children
            ) &&
            node.children.length > 0;


        /* Folder */

        let Icon = FaFileCode;
        let iconColor =
            "text-gray-300";

        if (isFolder) {
            const folderVisual =
                getFolderVisual(
                    node.name,
                    isExpanded
                );

            Icon =
                folderVisual.icon;

            iconColor =
                folderVisual.color;
        } else {
            const fileVisual =
                getFileVisual(
                    node.name
                );

            Icon =
                fileVisual.icon;

            iconColor =
                fileVisual.color;
        }


        return (
            <div
                key={nodeId}
                className="w-full"
            >
                <div
                    className={`
                        group
                        relative
                        flex
                        min-w-0
                        items-center
                        rounded-sm
                        py-[3px]
                        pr-1
                        ${
                            isRoot
                                ? "text-[15px]"
                                : "text-[14px]"
                        }
                        ${
                            isDark
                                ? "hover:bg-[#2a2d2e]"
                                : "hover:bg-gray-100"
                        }
                        ${
                            busy
                                ? "pointer-events-none opacity-70"
                                : ""
                        }
                    `}
                    style={{
                        paddingLeft:
                            `${depth * 16 + 4}px`,
                    }}
                    onContextMenu={(
                        event
                    ) =>
                        handleContextMenu(
                            event,
                            node
                        )
                    }
                >
                    {/* Expand / Collapse */}

                    {isFolder ? (
                        <button
                            type="button"
                            className="
                                mr-[2px]
                                flex
                                h-4
                                w-4
                                shrink-0
                                items-center
                                justify-center
                                text-gray-400
                            "
                            onClick={() =>
                                toggleFolder(
                                    nodeId
                                )
                            }
                        >
                            {hasChildren ? (
                                isExpanded ? (
                                    <FaChevronDown
                                        size={
                                            10
                                        }
                                    />
                                ) : (
                                    <FaChevronRight
                                        size={
                                            10
                                        }
                                    />
                                )
                            ) : (
                                <span className="w-[10px]" />
                            )}
                        </button>
                    ) : (
                        <div className="mr-[2px] w-4 shrink-0" />
                    )}


                    {/* Icon */}

                    <Icon
                        className={`
                            mr-2
                            shrink-0
                            ${iconColor}
                        `}
                        size={
                            isRoot
                                ? 16
                                : 15
                        }
                    />


                    {/* Name */}

                    <span
                        className={`
                            min-w-0
                            flex-1
                            truncate
                            ${
                                isRoot
                                    ? isDark
                                        ? "text-cyan-300"
                                        : "text-cyan-600"
                                    : isDark
                                    ? "text-gray-300"
                                    : "text-gray-700"
                            }
                        `}
                        onClick={() => {
                            if (
                                isFolder
                            ) {
                                toggleFolder(
                                    nodeId
                                );
                                return;
                            }

                            onOpenFile?.(node);
                        }}
                    >
                        {node.name}
                    </span>


                    {/* Folder actions */}

                    {isFolder && (
                        <div
                            className="
                                ml-auto
                                flex
                                shrink-0
                                items-center
                                gap-1
                                opacity-0
                                transition-opacity
                                group-hover:opacity-100
                            "
                        >
                            {/* Create File */}

                            <button
                                type="button"
                                title="New File"
                                className={`
                                    flex
                                    h-5
                                    w-5
                                    items-center
                                    justify-center
                                    rounded
                                    ${
                                        isDark
                                            ? "text-gray-400 hover:bg-[#3a3d3e] hover:text-white"
                                            : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                                    }
                                `}
                                onClick={(
                                    event
                                ) => {
                                    event.stopPropagation();

                                    handleCreateFile(
                                        node
                                    );
                                }}
                                onContextMenu={(
                                    event
                                ) =>
                                    event.stopPropagation()
                                }
                            >
                                <FaPlus
                                    size={
                                        11
                                    }
                                />
                            </button>


                            {/* Create Folder */}

                            <button
                                type="button"
                                title="New Folder"
                                className={`
                                    flex
                                    h-5
                                    w-5
                                    items-center
                                    justify-center
                                    rounded
                                    ${
                                        isDark
                                            ? "text-gray-400 hover:bg-[#3a3d3e] hover:text-white"
                                            : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                                    }
                                `}
                                onClick={(
                                    event
                                ) => {
                                    event.stopPropagation();

                                    handleCreateFolder(
                                        node
                                    );
                                }}
                                onContextMenu={(
                                    event
                                ) =>
                                    event.stopPropagation()
                                }
                            >
                                <FaFolderPlus
                                    size={
                                        12
                                    }
                                />
                            </button>
                        </div>
                    )}
                </div>


                {/* Children */}

                {isFolder &&
                    isExpanded &&
                    hasChildren && (
                        <div>
                            {node.children.map(
                                (child) =>
                                    renderNode(
                                        child,
                                        depth +
                                            1
                                    )
                            )}
                        </div>
                    )}
            </div>
        );
    };


    if (!tree || tree.length === 0) {
        return (
            <div
                className={`
                    px-4
                    py-6
                    text-center
                    text-xs
                    ${
                        isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                    }
                `}
            >
                No files yet
            </div>
        );
    }

    return (
        <>
            <div
                className="
                    w-full
                    min-w-0
                    select-none
                "
            >
                {tree.map((node) =>
                    renderNode(node)
                )}
            </div>


            {/* Context Menu */}

            {contextMenu && (
                <ContextMenu
                    menu={contextMenu}
                    isDark={isDark}
                    onClose={
                        closeContextMenu
                    }
                    onAction={
                        handleContextAction
                    }
                />
            )}
        </>
    );
};

export default FileTree;