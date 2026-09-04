import {
    FaTimes,
    FaFileCode,
    FaFileAlt,
    FaDatabase,
    FaServer,
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

import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";

const getFileIcon = (file) => {
    const extension = (
        file?.extension ||
        file?.name?.split(".").pop() ||
        ""
    ).toLowerCase();

    const fileName = (
        file?.name || ""
    ).toLowerCase();

    /* =================================
       SPECIAL FILES
    ================================= */

    if (
        fileName === "dockerfile" ||
        fileName.startsWith("dockerfile.")
    ) {
        return {
            icon: FaServer,
            color: "text-sky-400",
        };
    }

    if (
        fileName === ".gitignore" ||
        fileName === ".gitattributes"
    ) {
        return {
            icon: SiGit,
            color: "text-red-400",
        };
    }

    if (
        fileName === ".env" ||
        fileName.startsWith(".env.")
    ) {
        return {
            icon: FaFileCode,
            color: "text-yellow-400",
        };
    }

    if (fileName === "package.json") {
        return {
            icon: SiJson,
            color: "text-lime-400",
        };
    }

    if (
        fileName === "package-lock.json" ||
        fileName === "pnpm-lock.yaml" ||
        fileName === "yarn.lock"
    ) {
        return {
            icon: FaFileCode,
            color: "text-lime-400",
        };
    }

    /* =================================
       JAVASCRIPT
    ================================= */

    if (
        extension === "js" ||
        extension === "mjs" ||
        extension === "cjs"
    ) {
        return {
            icon: SiJavascript,
            color: "text-yellow-400",
        };
    }

    /* =================================
       REACT
    ================================= */

    if (
        extension === "jsx" ||
        extension === "tsx"
    ) {
        return {
            icon: SiReact,
            color: "text-cyan-400",
        };
    }

    /* =================================
       TYPESCRIPT
    ================================= */

    if (
        extension === "ts" ||
        extension === "mts" ||
        extension === "cts"
    ) {
        return {
            icon: SiTypescript,
            color: "text-blue-400",
        };
    }

    /* =================================
       JSON
    ================================= */

    if (
        extension === "json" ||
        extension === "jsonc"
    ) {
        return {
            icon: SiJson,
            color: "text-yellow-300",
        };
    }

    /* =================================
       CSS
    ================================= */

    if (extension === "css") {
        return {
            icon: SiCss,
            color: "text-sky-400",
        };
    }

    if (
        extension === "scss" ||
        extension === "sass"
    ) {
        return {
            icon: SiCss,
            color: "text-pink-400",
        };
    }

    if (extension === "less") {
        return {
            icon: SiCss,
            color: "text-blue-300",
        };
    }

    /* =================================
       HTML
    ================================= */

    if (
        extension === "html" ||
        extension === "htm"
    ) {
        return {
            icon: SiHtml5,
            color: "text-orange-500",
        };
    }

    /* =================================
       MARKDOWN
    ================================= */

    if (
        extension === "md" ||
        extension === "mdx"
    ) {
        return {
            icon: SiMarkdown,
            color: "text-blue-300",
        };
    }

    /* =================================
       PYTHON
    ================================= */

    if (
        extension === "py" ||
        extension === "pyw"
    ) {
        return {
            icon: FaFileCode,
            color: "text-yellow-400",
        };
    }

    /* =================================
       PHP
    ================================= */

    if (extension === "php") {
        return {
            icon: FaFileCode,
            color: "text-indigo-400",
        };
    }

    /* =================================
       JAVA
    ================================= */

    if (extension === "java") {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* =================================
       C
    ================================= */

    if (
        extension === "c" ||
        extension === "h"
    ) {
        return {
            icon: FaFileCode,
            color: "text-blue-400",
        };
    }

    /* =================================
       C++
    ================================= */

    if (
        extension === "cpp" ||
        extension === "cc" ||
        extension === "cxx" ||
        extension === "hpp" ||
        extension === "hh" ||
        extension === "hxx"
    ) {
        return {
            icon: FaFileCode,
            color: "text-blue-500",
        };
    }

    /* =================================
       C#
    ================================= */

    if (extension === "cs") {
        return {
            icon: FaFileCode,
            color: "text-purple-400",
        };
    }

    /* =================================
       GO
    ================================= */

    if (extension === "go") {
        return {
            icon: FaFileCode,
            color: "text-cyan-400",
        };
    }

    /* =================================
       RUST
    ================================= */

    if (extension === "rs") {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* =================================
       RUBY
    ================================= */

    if (
        extension === "rb" ||
        extension === "rake"
    ) {
        return {
            icon: FaFileCode,
            color: "text-red-500",
        };
    }

    /* =================================
       SWIFT
    ================================= */

    if (extension === "swift") {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* =================================
       KOTLIN
    ================================= */

    if (
        extension === "kt" ||
        extension === "kts"
    ) {
        return {
            icon: FaFileCode,
            color: "text-purple-400",
        };
    }

    /* =================================
       DART
    ================================= */

    if (extension === "dart") {
        return {
            icon: FaFileCode,
            color: "text-cyan-400",
        };
    }

    /* =================================
       SHELL
    ================================= */

    if (
        extension === "sh" ||
        extension === "bash" ||
        extension === "zsh" ||
        extension === "fish"
    ) {
        return {
            icon: FaFileCode,
            color: "text-green-400",
        };
    }

    /* =================================
       POWERSHELL
    ================================= */

    if (
        extension === "ps1" ||
        extension === "psm1" ||
        extension === "psd1"
    ) {
        return {
            icon: FaFileCode,
            color: "text-blue-400",
        };
    }

    /* =================================
       SQL
    ================================= */

    if (extension === "sql") {
        return {
            icon: FaDatabase,
            color: "text-blue-400",
        };
    }

    /* =================================
       DATABASE
    ================================= */

    if (
        extension === "db" ||
        extension === "sqlite" ||
        extension === "sqlite3"
    ) {
        return {
            icon: FaDatabase,
            color: "text-cyan-400",
        };
    }

    /* =================================
       YAML
    ================================= */

    if (
        extension === "yml" ||
        extension === "yaml"
    ) {
        return {
            icon: FaFileCode,
            color: "text-red-300",
        };
    }

    /* =================================
       XML
    ================================= */

    if (extension === "xml") {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* =================================
       SVG
    ================================= */

    if (extension === "svg") {
        return {
            icon: FaFileCode,
            color: "text-orange-400",
        };
    }

    /* =================================
       TEXT
    ================================= */

    if (extension === "txt") {
        return {
            icon: FaFileAlt,
            color: "text-gray-400",
        };
    }

    /* =================================
       LOG
    ================================= */

    if (extension === "log") {
        return {
            icon: FaFileAlt,
            color: "text-gray-500",
        };
    }

    /* =================================
       CONFIG
    ================================= */

    if (
        extension === "conf" ||
        extension === "config"
    ) {
        return {
            icon: FaServer,
            color: "text-cyan-400",
        };
    }

    /* =================================
       DEFAULT
    ================================= */

    return {
        icon: FaFileCode,
        color: "text-gray-400",
    };
};

const FileTabsNavbar = () => {
    const { isDark } = useTheme();

    const {
        openFiles,
        activeFileId,
        activateFile,
        closeFile,
    } = useWorkspace();

    return (
        <nav className="fixed left-[435px] right-2 top-[72px] z-30">
            <div
                className={`flex h-[40px] w-full items-end overflow-x-auto overflow-y-hidden effect-less rounded-xl ${
                    isDark
                        ? "border-white/10 bg-slate-900/80"
                        : "border-black/10 bg-white/80"
                }`}
                style={{
                    scrollbarWidth: "thin",
                }}
            >
                {openFiles.map((file) => {
                    const fileId =
                        file._id || file.id;

                    const isActive =
                        fileId === activeFileId;

                    const {
                        icon: Icon,
                        color,
                    } = getFileIcon(file);

                    return (
                        <div
                            key={fileId}
                            className={`group relative flex h-[40px] min-w-[130px] max-w-[220px] shrink-0 items-center 
                                border-r transition-all duration-200 ${
                                isDark
                                    ? "border-white/10"
                                    : "border-black/10"
                            } ${
                                isActive
                                    ? isDark
                                        ? "bg-white/[0.09]"
                                        : "bg-black/[0.05]"
                                    : isDark
                                    ? "bg-transparent hover:bg-white/[0.035]"
                                    : "bg-transparent hover:bg-black/[0.02]"
                            }`}
                        >
                            {isActive && (
                                <span
                                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                                        isDark
                                            ? "bg-cyan-400"
                                            : "bg-[#1227b2]"
                                    }`}
                                />
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    activateFile(fileId)
                                }
                                className={`flex min-w-0 flex-1 items-center gap-2 px-3 text-left text-[16px] transition-all duration-200 ${
                                    isActive
                                        ? isDark
                                            ? "text-white"
                                            : "text-slate-900"
                                        : isDark
                                        ? "text-white/45 hover:text-white/75"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                                title={file.name}
                            >
                                <Icon
                                    className={`shrink-0 text-[13px] ${color}`}
                                />

                                <span className="min-w-0 flex-1 truncate">
                                    {file.name}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    closeFile(fileId)
                                }
                                aria-label={`Close ${file.name}`}
                                className={`mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all ${
                                    isDark
                                        ? "text-white/30 hover:bg-white/10 hover:text-white"
                                        : "text-slate-400 hover:bg-black/10 hover:text-slate-800"
                                }`}
                            >
                                <FaTimes className="text-[8px]" />
                            </button>
                        </div>
                    );
                })}

                {openFiles.length === 0 && (
                    <div
                        className={`flex h-full items-center px-3 text-[11px] ${
                            isDark
                                ? "text-white/25"
                                : "text-slate-400"
                        }`}
                    >
                        Open a file to start coding
                    </div>
                )}
            </div>
        </nav>
    );
};

export default FileTabsNavbar;