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
    FaTerminal,
    FaCheck,
    FaCodeBranch,
} from "react-icons/fa";

import { TbFolderCode } from "react-icons/tb";
import { VscFolderLibrary } from "react-icons/vsc";
import { PiFolderSimpleUserDuotone } from "react-icons/pi";

import {
    SiJavascript, SiTypescript, SiReact, SiJson, SiCss,
    SiHtml5, SiMarkdown, SiGit,
} from "react-icons/si";
import { createFolder, createFile, updateFile, deleteFile } from "../features/file";

// Returns the correct icon + color for folders based on their name
const getFolderVisual = (name = "", isOpen = false) => {
    const key = name.toLowerCase().trim();

    const folderMap = {
        // ─── Project Structure ─────────────────────────────────────────────
        backend: { icon: FaServer, color: "text-yellow-400" },
        frontend: { icon: PiFolderSimpleUserDuotone, color: "text-blue-500" },
        src: { icon: TbFolderCode, color: "text-green-400" },
        app: { icon: TbFolderCode, color: "text-green-400" },
        lib: { icon: VscFolderLibrary, color: "text-purple-400" },
        core: { icon: VscFolderLibrary, color: "text-purple-400" },

        // ─── Backend ───────────────────────────────────────────────────────
        routes: { icon: FaRoute, color: "text-green-400" },
        route: { icon: FaRoute, color: "text-green-400" },
        controllers: { icon: FaCogs, color: "text-yellow-400" },
        controller: { icon: FaCogs, color: "text-yellow-400" },
        models: { icon: VscFolderLibrary, color: "text-red-500" },
        model: { icon: VscFolderLibrary, color: "text-red-400" },
        middleware: { icon: FaShieldAlt, color: "text-orange-400" },
        middlewares: { icon: FaShieldAlt, color: "text-orange-400" },
        services: { icon: FaServer, color: "text-sky-400" },
        service: { icon: FaServer, color: "text-sky-400" },
        repositories: { icon: FaDatabase, color: "text-red-400" },
        repository: { icon: FaDatabase, color: "text-red-400" },
        database: { icon: FaDatabase, color: "text-yellow-400" },
        db: { icon: FaDatabase, color: "text-yellow-400" },
        config: { icon: FaWrench, color: "text-cyan-400" },
        configs: { icon: FaWrench, color: "text-cyan-400" },
        utils: { icon: FaWrench, color: "text-green-400" },
        utility: { icon: FaWrench, color: "text-green-400" },
        utilities: { icon: FaWrench, color: "text-green-400" },
        helpers: { icon: FaWrench, color: "text-green-400" },
        helper: { icon: FaWrench, color: "text-green-400" },
        validators: { icon: FaShieldAlt, color: "text-orange-400" },
        validation: { icon: FaShieldAlt, color: "text-orange-400" },
        schemas: { icon: FaDatabase, color: "text-red-400" },
        schema: { icon: FaDatabase, color: "text-red-400" },
        workers: { icon: FaCogs, color: "text-purple-400" },
        worker: { icon: FaCogs, color: "text-purple-400" },
        jobs: { icon: FaCogs, color: "text-purple-400" },
        queues: { icon: FaCogs, color: "text-purple-400" },
        events: { icon: FaCodeBranch, color: "text-pink-400" },
        sockets: { icon: FaCodeBranch, color: "text-pink-400" },

        // ─── Authentication / Security ────────────────────────────────────
        auth: { icon: FaShieldAlt, color: "text-orange-400" },
        authentication: { icon: FaShieldAlt, color: "text-orange-400" },
        authorization: { icon: FaShieldAlt, color: "text-red-400" },
        security: { icon: FaShieldAlt, color: "text-red-400" },
        permissions: { icon: FaShieldAlt, color: "text-red-400" },
        sessions: { icon: FaShieldAlt, color: "text-yellow-400" },

        // ─── Frontend / React ──────────────────────────────────────────────
        components: { icon: FaLayerGroup, color: "text-purple-400" },
        component: { icon: FaLayerGroup, color: "text-purple-400" },
        pages: { icon: FaLayerGroup, color: "text-purple-400" },
        views: { icon: FaLayerGroup, color: "text-purple-400" },
        layouts: { icon: FaLayerGroup, color: "text-purple-400" },
        hooks: { icon: FaWrench, color: "text-purple-400" },
        context: { icon: FaLayerGroup, color: "text-cyan-400" },
        contexts: { icon: FaLayerGroup, color: "text-cyan-400" },
        providers: { icon: FaLayerGroup, color: "text-cyan-400" },
        redux: { icon: FaCodeBranch, color: "text-purple-500" },
        store: { icon: FaDatabase, color: "text-purple-500" },
        slices: { icon: FaCodeBranch, color: "text-purple-400" },
        features: { icon: FaCodeBranch, color: "text-purple-400" },
        reducers: { icon: FaCodeBranch, color: "text-purple-400" },
        actions: { icon: FaCodeBranch, color: "text-purple-400" },
        api: { icon: FaServer, color: "text-sky-400" },
        assets: { icon: FaFolder, color: "text-orange-400" },
        images: { icon: FaFolder, color: "text-pink-400" },
        icons: { icon: FaFolder, color: "text-yellow-400" },
        styles: { icon: FaFolder, color: "text-sky-400" },
        css: { icon: FaFolder, color: "text-sky-400" },

        // ─── Public / Static ───────────────────────────────────────────────
        public: { icon: FaFolder, color: "text-blue-400" },
        static: { icon: FaFolder, color: "text-blue-400" },
        uploads: { icon: FaFolder, color: "text-orange-400" },
        downloads: { icon: FaFolder, color: "text-green-400" },

        // ─── Testing ───────────────────────────────────────────────────────
        test: { icon: FaFolder, color: "text-purple-400" },
        tests: { icon: FaFolder, color: "text-purple-400" },
        __tests__: { icon: FaFolder, color: "text-purple-400" },
        specs: { icon: FaFolder, color: "text-purple-400" },
        e2e: { icon: FaFolder, color: "text-purple-400" },
        fixtures: { icon: FaFolder, color: "text-purple-400" },
        mocks: { icon: FaFolder, color: "text-purple-400" },

        // ─── DevOps / Docker ───────────────────────────────────────────────
        docker: { icon: FaServer, color: "text-sky-400" },
        containers: { icon: FaServer, color: "text-sky-400" },
        deployment: { icon: FaServer, color: "text-sky-400" },
        deploy: { icon: FaServer, color: "text-sky-400" },
        nginx: { icon: FaServer, color: "text-green-500" },
        kubernetes: { icon: FaServer, color: "text-blue-500" },
        k8s: { icon: FaServer, color: "text-blue-500" },
        terraform: { icon: FaServer, color: "text-purple-500" },
        scripts: { icon: FaWrench, color: "text-yellow-400" },

        // ─── Node / Packages ───────────────────────────────────────────────
        node_modules: { icon: FaFolder, color: "text-lime-400" },
        modules: { icon: FaFolder, color: "text-lime-400" },
        packages: { icon: FaFolder, color: "text-lime-400" },

        // ─── Microservices ────────────────────────────────────────────────
        gateway: { icon: FaServer, color: "text-sky-400" },
        gateways: { icon: FaServer, color: "text-sky-400" },
        microservices: { icon: FaServer, color: "text-sky-400" },
        services: { icon: FaServer, color: "text-sky-400" },

        // ─── Documentation ─────────────────────────────────────────────────
        docs: { icon: FaFileAlt, color: "text-blue-300" },
        documentation: { icon: FaFileAlt, color: "text-blue-300" },
        examples: { icon: FaFileCode, color: "text-cyan-400" },
        examples: { icon: FaFileCode, color: "text-cyan-400" },

        // ─── Git ───────────────────────────────────────────────────────────
        ".git": { icon: SiGit, color: "text-red-400" },
        ".github": { icon: SiGit, color: "text-gray-400" },
        workflows: { icon: SiGit, color: "text-gray-400" },

        // ─── Common Generic Folders ───────────────────────────────────────
        temp: { icon: FaFolder, color: "text-gray-400" },
        tmp: { icon: FaFolder, color: "text-gray-400" },
        logs: { icon: FaFolder, color: "text-gray-400" },
        cache: { icon: FaFolder, color: "text-gray-400" },
        data: { icon: FaDatabase, color: "text-yellow-400" },
        backup: { icon: FaFolder, color: "text-orange-400" },
        backups: { icon: FaFolder, color: "text-orange-400" },
        types: { icon: FaFileCode, color: "text-blue-400" },
        interfaces: { icon: FaFileCode, color: "text-blue-400" },
        constants: { icon: FaSlidersH, color: "text-yellow-400" },
        constants: { icon: FaSlidersH, color: "text-yellow-400" },
    };

    return folderMap[key] || {
        icon: isOpen ? FaFolderOpen : FaFolder,
        color: "text-sky-300",
    };
};

// Returns the correct icon + color for files based on extension/name
const getFileVisual = (name = "") => {
    const lowerName = name.toLowerCase();

    // JavaScript
    if ([".js", ".mjs", ".cjs"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiJavascript, color: "text-yellow-400" };

    // TypeScript
    if ([".ts", ".mts", ".cts"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiTypescript, color: "text-blue-400" };

    // React
    if ([".jsx", ".tsx"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiReact, color: "text-cyan-400" };

    // JSON
    if ([".json", ".json5", ".jsonc"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiJson, color: "text-yellow-300" };

    // CSS
    if ([".css", ".scss", ".sass", ".less"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiCss, color: "text-sky-400" };

    // HTML
    if ([".html", ".htm"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiHtml5, color: "text-orange-500" };

    // Markdown
    if ([".md", ".mdx"].some(ext => lowerName.endsWith(ext)))
        return { icon: SiMarkdown, color: "text-blue-300" };

    // Git
    if ([".gitignore", ".gitattributes", ".gitmodules"].includes(lowerName))
        return { icon: SiGit, color: "text-red-400" };

    // Environment
    if (lowerName === ".env" || lowerName.startsWith(".env."))
        return { icon: FaSlidersH, color: "text-yellow-400" };

    // Package Manager
    if (["package.json", "package-lock.json", "npm-shrinkwrap.json"].includes(lowerName))
        return { icon: FaFileCode, color: "text-lime-400" };

    if (["yarn.lock", "pnpm-lock.yaml", "bun.lockb"].includes(lowerName))
        return { icon: FaFileCode, color: "text-orange-400" };

    // Docker
    if (lowerName === "dockerfile" || lowerName.startsWith("dockerfile."))
        return { icon: FaServer, color: "text-sky-400" };

    if (lowerName.startsWith("docker-compose") && lowerName.endsWith((".yml", ".yaml")))
        return { icon: FaServer, color: "text-blue-400" };

    // YAML
    if ([".yml", ".yaml"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaSlidersH, color: "text-red-300" };

    // XML / SVG
    if (lowerName.endsWith(".svg"))
        return { icon: FaFileCode, color: "text-orange-400" };

    if (lowerName.endsWith(".xml"))
        return { icon: FaFileCode, color: "text-orange-300" };

    // GraphQL
    if ([".graphql", ".gql"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaRoute, color: "text-pink-400" };

    // Python
    if ([".py", ".pyw"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileCode, color: "text-blue-400" };

    // Java
    if (lowerName.endsWith(".java"))
        return { icon: FaFileCode, color: "text-red-400" };

    // C / C++
    if ([".c", ".h"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileCode, color: "text-blue-300" };

    if ([".cpp", ".cc", ".cxx", ".hpp"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileCode, color: "text-blue-400" };

    // C#
    if (lowerName.endsWith(".cs"))
        return { icon: FaFileCode, color: "text-purple-400" };

    // Go
    if (lowerName.endsWith(".go"))
        return { icon: FaFileCode, color: "text-cyan-400" };

    // Rust
    if (lowerName.endsWith(".rs"))
        return { icon: FaFileCode, color: "text-orange-400" };

    // PHP
    if (lowerName.endsWith(".php"))
        return { icon: FaFileCode, color: "text-purple-400" };

    // Ruby
    if ([".rb", ".rake"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileCode, color: "text-red-400" };

    // Kotlin
    if ([".kt", ".kts"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileCode, color: "text-purple-400" };

    // Swift
    if (lowerName.endsWith(".swift"))
        return { icon: FaFileCode, color: "text-orange-400" };

    // Dart / Flutter
    if (lowerName.endsWith(".dart"))
        return { icon: FaFileCode, color: "text-cyan-400" };

    // SQL
    if ([".sql", ".sqlite", ".db"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaDatabase, color: "text-yellow-400" };

    // Shell
    if ([".sh", ".bash", ".zsh", ".fish"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaTerminal, color: "text-green-400" };

    // PowerShell
    if (lowerName.endsWith(".ps1"))
        return { icon: FaTerminal, color: "text-blue-400" };

    // Vue
    if (lowerName.endsWith(".vue"))
        return { icon: FaFileCode, color: "text-green-400" };

    // Svelte
    if (lowerName.endsWith(".svelte"))
        return { icon: FaFileCode, color: "text-orange-500" };

    // Prisma
    if (lowerName.endsWith(".prisma"))
        return { icon: FaDatabase, color: "text-teal-400" };

    // Terraform
    if (lowerName.endsWith(".tf"))
        return { icon: FaServer, color: "text-purple-400" };

    // Nginx
    if (["nginx.conf", "nginx"].includes(lowerName))
        return { icon: FaServer, color: "text-green-400" };

    // Makefile
    if (["makefile", "gnumakefile"].includes(lowerName))
        return { icon: FaWrench, color: "text-gray-300" };

    // Config files
    if (
        lowerName.startsWith("vite.config.") ||
        lowerName.startsWith("next.config.") ||
        lowerName.startsWith("nuxt.config.") ||
        lowerName.startsWith("astro.config.") ||
        lowerName.startsWith("webpack.config.") ||
        lowerName.startsWith("rollup.config.")
    )
        return { icon: FaCogs, color: "text-green-400" };

    // Tailwind / PostCSS
    if (
        lowerName.startsWith("tailwind.config.") ||
        lowerName.startsWith("postcss.config.")
    )
        return { icon: FaCogs, color: "text-cyan-400" };

    // ESLint / Prettier
    if (
        lowerName.startsWith(".eslintrc") ||
        lowerName.startsWith("eslint.config.") ||
        lowerName.startsWith(".prettierrc") ||
        lowerName.startsWith("prettier.config.")
    )
        return { icon: FaCogs, color: "text-purple-400" };

    // TypeScript Config
    if (lowerName.startsWith("tsconfig") || lowerName === "jsconfig.json")
        return { icon: SiTypescript, color: "text-blue-400" };

    // Babel
    if (lowerName.startsWith("babel.config.") || lowerName.startsWith(".babelrc"))
        return { icon: FaCogs, color: "text-yellow-400" };

    // Testing
    if (
        lowerName.startsWith("jest.config.") ||
        lowerName.startsWith("vitest.config.") ||
        lowerName.startsWith("playwright.config.") ||
        lowerName.startsWith("cypress.config.")
    )
        return { icon: FaCheck, color: "text-green-400" };

    // Deployment
    if (["vercel.json", "netlify.toml", "render.yaml"].includes(lowerName))
        return { icon: FaServer, color: "text-white" };

    // GitHub / CI
    if (
        lowerName === "action.yml" ||
        lowerName === "action.yaml" ||
        lowerName.endsWith(".workflow.yml")
    )
        return { icon: SiGit, color: "text-purple-400" };

    // Documentation
    if (
        lowerName === "readme.md" ||
        lowerName === "readme.txt" ||
        lowerName === "changelog.md"
    )
        return { icon: SiMarkdown, color: "text-blue-300" };

    // License
    if (lowerName === "license" || lowerName.startsWith("license."))
        return { icon: FaFileAlt, color: "text-yellow-300" };

    // Editor / tooling
    if (lowerName === ".editorconfig")
        return { icon: FaCogs, color: "text-gray-400" };

    if ([".npmrc", ".yarnrc", ".yarnrc.yml"].includes(lowerName))
        return { icon: FaCogs, color: "text-red-400" };

    // Text / Logs
    if ([".txt", ".log"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileAlt, color: "text-gray-400" };

    // Images
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileAlt, color: "text-pink-400" };

    // Audio
    if ([".mp3", ".wav", ".ogg"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileAlt, color: "text-purple-400" };

    // Video
    if ([".mp4", ".webm", ".mov", ".avi"].some(ext => lowerName.endsWith(ext)))
        return { icon: FaFileAlt, color: "text-red-400" };

    // PDF
    if (lowerName.endsWith(".pdf"))
        return { icon: FaFileAlt, color: "text-red-500" };

    // Default
    return { icon: FaFileCode, color: "text-gray-300" };
};

// Right-click menu for file/folder actions
const ContextMenu = ({ menu, isDark, onClose, onAction }) => {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ x: menu.x, y: menu.y });

    // Keeps context menu inside the screen
    useEffect(() => {
        const updatePosition = () => {
            if (!menuRef.current) return;

            const rect = menuRef.current.getBoundingClientRect();
            const padding = 8;
            let x = menu.x;
            let y = menu.y;

            if (x + rect.width > window.innerWidth - padding)
                x = window.innerWidth - rect.width - padding;

            if (y + rect.height > window.innerHeight - padding)
                y = window.innerHeight - rect.height - padding;

            setPosition({
                x: Math.max(padding, x),
                y: Math.max(padding, y),
            });
        };

        requestAnimationFrame(updatePosition);
    }, [menu.x, menu.y]);

    // Closes menu when clicking outside, scrolling or resizing
    useEffect(() => {
        const closeOnOutside = event => {
            if (menuRef.current && !menuRef.current.contains(event.target))
                onClose();
        };

        const closeOnScroll = () => onClose();
        const closeOnResize = () => onClose();

        document.addEventListener("mousedown", closeOnOutside);
        window.addEventListener("scroll", closeOnScroll, true);
        window.addEventListener("resize", closeOnResize);

        return () => {
            document.removeEventListener("mousedown", closeOnOutside);
            window.removeEventListener("scroll", closeOnScroll, true);
            window.removeEventListener("resize", closeOnResize);
        };
    }, [onClose]);

    // Available context-menu actions
    const items = [
        {
            label: "Create Folder",
            icon: FaFolderPlus,
            action: "create-folder",
            visible: menu.node?.type === "folder",
        },
        {
            label: "Create File",
            icon: FaPlus,
            action: "create-file",
            visible: menu.node?.type === "folder",
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

    const visibleItems = items.filter(item => item.visible);

    return createPortal(
        <div
            ref={menuRef}
            className={`
        fixed z-[999999] min-w-[185px] overflow-hidden rounded-md
        border shadow-2xl backdrop-blur-md select-none
        ${isDark
                    ? "border-gray-700 bg-[#181818]/98 text-gray-200"
                    : "border-gray-300 bg-white/98 text-gray-800"}
      `}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onContextMenu={event => event.preventDefault()}
        >
            {visibleItems.map((item, index) => {
                const Icon = item.icon;

                return (
                    <button
                        key={item.action}
                        type="button"
                        onClick={() => onAction(item.action)}
                        className={`
              flex w-full items-center gap-3 px-3 py-2 text-left
              text-[13px] transition-colors
              ${item.danger
                                ? "text-red-400 hover:bg-red-500/10"
                                : isDark
                                    ? "hover:bg-[#2a2d2e]"
                                    : "hover:bg-gray-100"}
              ${index !== visibleItems.length - 1
                                ? isDark
                                    ? "border-b border-gray-800"
                                    : "border-b border-gray-200"
                                : ""}
            `}
                    >
                        <Icon
                            size={14}
                            className={
                                item.danger
                                    ? "text-red-400"
                                    : isDark
                                        ? "text-gray-400"
                                        : "text-gray-500"
                            }
                        />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

// Main file-tree component
const FileTree = ({ tree = [], projectId, isDark, onRefresh, onOpenFile }) => {
    const [expanded, setExpanded] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [busy, setBusy] = useState(false);

    // Gets MongoDB _id or normal id
    const getNodeId = node => node?._id || node?.id;

    // Checks whether the folder is the project root
    const isRootNode = node =>
        node?.type === "folder" && node?.parentId === null;

    // Gets the parent folder ID for creating files/folders
    const getCreateParentId = node => {
        if (!node) return null;
        return node.type === "folder" ? getNodeId(node) : node.parentId || null;
    };

    const closeContextMenu = () => setContextMenu(null);

    // Opens/closes a folder
    const toggleFolder = nodeId => {
        setExpanded(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    // Creates a new folder inside the selected folder
    const handleCreateFolder = async node => {
        if (!node) return;

        const parentId = getCreateParentId(node);
        if (!parentId) return;

        const folderName = window.prompt("Enter folder name:");
        if (!folderName?.trim()) return;

        try {
            setBusy(true);
            await createFolder(projectId, folderName.trim(), parentId);

            setExpanded(prev => ({ ...prev, [getNodeId(node)]: true }));
            closeContextMenu();
            await onRefresh();
        } catch (error) {
            console.error("Create folder failed:", error);
            alert(error?.response?.data?.message || "Failed to create folder.");
        } finally {
            setBusy(false);
        }
    };

    // Creates a new file inside the selected folder
    const handleCreateFile = async node => {
        if (!node) return;

        const parentId = getCreateParentId(node);
        if (!parentId) return;

        const fileName = window.prompt("Enter file name:");
        if (!fileName?.trim()) return;

        try {
            setBusy(true);
            await createFile(projectId, fileName.trim(), parentId);

            setExpanded(prev => ({ ...prev, [getNodeId(node)]: true }));
            closeContextMenu();
            await onRefresh();
        } catch (error) {
            console.error("Create file failed:", error);
            alert(error?.response?.data?.message || "Failed to create file.");
        } finally {
            setBusy(false);
        }
    };

    // Renames a file or folder
    const handleRename = async node => {
        if (!node || isRootNode(node)) return;

        const newName = window.prompt("Enter new name:", node.name);
        if (!newName?.trim() || newName.trim() === node.name) return;

        try {
            setBusy(true);
            await updateFile(getNodeId(node), { name: newName.trim() });

            closeContextMenu();
            await onRefresh();
        } catch (error) {
            console.error("Rename failed:", error);
            alert(error?.response?.data?.message || "Failed to rename.");
        } finally {
            setBusy(false);
        }
    };

    // Deletes a file or folder
    const handleDelete = async node => {
        if (!node || isRootNode(node)) return;

        const confirmed = window.confirm(`Delete "${node.name}"?`);
        if (!confirmed) return;

        try {
            setBusy(true);
            await deleteFile(getNodeId(node));

            closeContextMenu();
            await onRefresh();
        } catch (error) {
            console.error("Delete failed:", error);
            alert(error?.response?.data?.message || "Failed to delete.");
        } finally {
            setBusy(false);
        }
    };

    // Runs the selected context-menu action
    const handleContextAction = async action => {
        const node = contextMenu?.node;
        if (!node) return;

        switch (action) {
            case "create-folder":
                await handleCreateFolder(node);
                break;
            case "create-file":
                await handleCreateFile(node);
                break;
            case "rename":
                await handleRename(node);
                break;
            case "delete":
                await handleDelete(node);
                break;
            default:
                break;
        }
    };

    // Opens the right-click context menu
    const handleContextMenu = (event, node) => {
        event.preventDefault();
        event.stopPropagation();

        setContextMenu({
            node,
            isRoot: isRootNode(node),
            x: event.clientX,
            y: event.clientY,
        });
    };

    // Recursively renders folders and files
    const renderNode = (node, depth = 0) => {
        const nodeId = getNodeId(node);
        const isFolder = node.type === "folder";
        const isRoot = isRootNode(node);
        const isExpanded = !!expanded[nodeId];
        const hasChildren = isFolder && node.children?.length > 0;

        // Select icon/color according to node type
        let Icon = FaFileCode;
        let iconColor = "text-gray-300";

        if (isFolder) {
            const visual = getFolderVisual(node.name, isExpanded);
            Icon = visual.icon;
            iconColor = visual.color;
        } else {
            const visual = getFileVisual(node.name);
            Icon = visual.icon;
            iconColor = visual.color;
        }

        return (
            <div key={nodeId} className="w-full">
                {/* Single file/folder row */}
                <div
                    className={`
            group relative flex min-w-0 items-center rounded-sm
            py-[3px] pr-1
            ${isRoot ? "text-[15px]" : "text-[14px]"}
            ${isDark ? "hover:bg-[#2a2d2e]" : "hover:bg-gray-100"}
            ${busy ? "pointer-events-none opacity-70" : ""}
          `}
                    style={{ paddingLeft: `${depth * 16 + 4}px` }}
                    onContextMenu={event => handleContextMenu(event, node)}
                >
                    {/* Expand/collapse arrow */}
                    {/* Folder arrow: right when closed, down when open */}
                    {isFolder ? (
                        <button
                            type="button"
                            className="mr-[2px] flex h-4 w-4 shrink-0 items-center justify-center text-gray-400"
                            onClick={() => toggleFolder(nodeId)}
                        >
                            {isExpanded ? (
                                <FaChevronDown size={10} />
                            ) : (
                                <FaChevronRight size={10} />
                            )}
                        </button>
                    ) : (
                        <div className="mr-[2px] w-4 shrink-0" />
                    )}

                    {/* File/folder icon */}
                    <Icon
                        size={isRoot ? 16 : 15}
                        className={`mr-2 shrink-0 ${iconColor}`}
                    />

                    {/* File/folder name */}
                    <span
                        className={`
              min-w-0 flex-1 truncate
              ${isRoot
                                ? isDark
                                    ? "text-cyan-400"
                                    : "text-cyan-600"
                                : isDark
                                    ? "text-gray-200"
                                    : "text-gray-700"}
            `}
                        onClick={() => {
                            if (isFolder) {
                                toggleFolder(nodeId);
                                return;
                            }

                            onOpenFile?.(node);
                        }}
                    >
                        {node.name}
                    </span>

                    {/* Quick actions shown when hovering a folder */}
                    {isFolder && (
                        <div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* New file button */}
                            <button
                                type="button"
                                title="New File"
                                className={`
                  flex h-5 w-5 items-center justify-center rounded
                  ${isDark
                                        ? "text-gray-400 hover:bg-[#3a3d3e] hover:text-white"
                                        : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}
                `}
                                onClick={event => {
                                    event.stopPropagation();
                                    handleCreateFile(node);
                                }}
                                onContextMenu={event => event.stopPropagation()}
                            >
                                <FaPlus size={11} />
                            </button>

                            {/* New folder button */}
                            <button
                                type="button"
                                title="New Folder"
                                className={`
                  flex h-5 w-5 items-center justify-center rounded
                  ${isDark
                                        ? "text-gray-400 hover:bg-[#3a3d3e] hover:text-white"
                                        : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}
                `}
                                onClick={event => {
                                    event.stopPropagation();
                                    handleCreateFolder(node);
                                }}
                                onContextMenu={event => event.stopPropagation()}
                            >
                                <FaFolderPlus size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Recursively render children when folder is expanded */}
                {isFolder && isExpanded && hasChildren && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Empty project state
    if (!tree || tree.length === 0) {
        return (
            <div
                className={`
          px-4 py-6 text-center text-xs
          ${isDark ? "text-gray-500" : "text-gray-400"}
        `}
            >
                No files yet
            </div>
        );
    }

    return (
        <>
            {/* File tree */}
            <span className="text-white font-plex tracking-wider px-1">File Explorer</span>
            <hr className="text-gray-300/20 mt-1.5 mb-2"></hr>
            <div className="w-full min-w-0 select-none font-plex tracking-wide">
                {tree.map(node => renderNode(node))}
            </div>

            {/* Right-click context menu */}
            {contextMenu && (
                <ContextMenu
                    menu={contextMenu}
                    isDark={isDark}
                    onClose={closeContextMenu}
                    onAction={handleContextAction}
                />
            )}
        </>
    );
};

export default FileTree;