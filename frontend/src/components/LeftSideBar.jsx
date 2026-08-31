import { useState } from "react";
import {
    FaFolder,
    FaStar,
} from "react-icons/fa";

import { useTheme } from "../context/ThemeContext";
import FileExplorer from "./FileExplorer";

const LeftSideBar = () => {
    const { isDark } = useTheme();

    const [activePanel, setActivePanel] =
        useState(null);

    const togglePanel = (panel) => {
        setActivePanel((previous) =>
            previous === panel
                ? null
                : panel
        );
    };

    return (
        <>
            {/* ======================================
                LEFT SIDEBAR
            ====================================== */}
            <aside
                className={`fixed left-0 top-[58px] bottom-4 z-40 w-[62px] effect-less translate-x-2 translate-y-2 rounded-2xl border backdrop-blur-3xl transition-all duration-500 ${
                    isDark
                        ? "border-slate-800/80 bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
                        : "border-black/10 bg-white/70 shadow-[0_20px_20px_rgba(0,0,0,0.18)]"
                }`}
            >
                {/* FILES */}
                <button
                    type="button"
                    aria-label="Files"
                    onClick={() =>
                        togglePanel("files")
                    }
                    className={`group flex h-14 w-full items-center justify-center rounded-t-2xl transition-all duration-300 ${
                        activePanel === "files"
                            ? isDark
                                ? "bg-white/10 text-cyan-400"
                                : "bg-black/5 text-[#1227b2]"
                            : isDark
                                ? "text-white/60 hover:bg-white/10 hover:text-cyan-400"
                                : "text-slate-500 hover:bg-black/5 hover:text-[#1227b2]"
                    }`}
                >
                    <FaFolder
                        className={`text-[18px] transition-all duration-300 ${
                            activePanel === "files"
                                ? "scale-110"
                                : "group-hover:scale-110"
                        }`}
                    />
                </button>

                {/* DIVIDER */}
                <div
                    className={`mx-2 h-px ${
                        isDark
                            ? "bg-white/10"
                            : "bg-black/10"
                    }`}
                />

                {/* STARRED */}
                <button
                    type="button"
                    aria-label="Starred Projects"
                    onClick={() =>
                        togglePanel("starred")
                    }
                    className={`group flex h-14 w-full items-center justify-center rounded-b-2xl transition-all duration-300 ${
                        activePanel === "starred"
                            ? isDark
                                ? "bg-white/10 text-yellow-400"
                                : "bg-black/5 text-yellow-500"
                            : isDark
                                ? "text-white/60 hover:bg-white/10 hover:text-yellow-400"
                                : "text-slate-500 hover:bg-black/5 hover:text-yellow-500"
                    }`}
                >
                    <FaStar
                        className={`text-[18px] transition-all duration-300 ${
                            activePanel === "starred"
                                ? "scale-110"
                                : "group-hover:scale-110"
                        }`}
                    />
                </button>
            </aside>

            {/* ======================================
                FILE / STARRED PANEL
            ====================================== */}
            <FileExplorer
                isOpen={activePanel !== null}
                mode={activePanel}
            />
        </>
    );
};

export default LeftSideBar;