import { useEffect } from "react";
import {
    FaTimes,
    FaLinkedin,
    FaGithub,
    FaExternalLinkAlt,
    FaBook,
    FaCheck,
    FaCode,
    FaRocket,
    FaRobot,
    FaTools,
} from "react-icons/fa";

import { useTheme } from "../context/ThemeContext";

const DocumentPopup = ({ isOpen, onClose }) => {
    const { isDark } = useTheme();

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentFeatures = [
        "HTML",
        "CSS",
        "JavaScript",
        "Project & file management",
        "Code editor",
        "Live Preview",
        "Terminal",
        "Light / Dark theme",
        "AI-assisted development",
    ];

    const upcomingFeatures = [
        {
            icon: FaCode,
            title: "More Languages",
            description:
                "Expand beyond HTML, CSS and JavaScript with support for additional programming languages.",
        },
        {
            icon: FaRocket,
            title: "Framework Support",
            description:
                "Bring modern frameworks and libraries into the ZS Code development workflow.",
        },
        {
            icon: FaRobot,
            title: "Smarter AI",
            description:
                "Improve the AI coding experience with better generation, understanding and project assistance.",
        },
        {
            icon: FaTools,
            title: "Developer Tools",
            description:
                "Add more tools for debugging, testing, project management and development workflows.",
        },
    ];

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Overlay */}
            <div
                className={`absolute inset-0 backdrop-blur-md ${
                    isDark ? "bg-black/70" : "bg-black/40"
                }`}
            />

            {/* Popup */}
            <div
                className={`relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${
                    isDark
                        ? "border-white/10 bg-[#181818] text-white"
                        : "border-black/10 bg-white text-[#181818]"
                }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between border-b px-5 py-3 ${
                        isDark
                            ? "border-white/10 bg-[#202020]"
                            : "border-black/10 bg-gray-50"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FaBook
                            className={
                                isDark
                                    ? "text-purple-400"
                                    : "text-purple-700"
                            }
                        />

                        <span
                            className={`font-plex text-sm font-semibold tracking-wide ${
                                isDark
                                    ? "text-white/80"
                                    : "text-slate-700"
                            }`}
                        >
                            ZS Code Documentation
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close document"
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                            isDark
                                ? "text-white/50 hover:bg-white/10 hover:text-white"
                                : "text-slate-500 hover:bg-black/5 hover:text-black"
                        }`}
                    >
                        <FaTimes size={15} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto">
                    <div className="px-6 py-9 sm:px-10 sm:py-10">

                        {/* Hero */}
                        <div className="text-center">
                            <p
                                className={`mb-3 text-[11px] font-medium uppercase tracking-[0.3em] ${
                                    isDark
                                        ? "text-white/35"
                                        : "text-slate-400"
                                }`}
                            >
                                Developer Workspace
                            </p>

                            <h1
                                className={`text-3xl font-bold tracking-tight sm:text-4xl ${
                                    isDark
                                        ? "text-white"
                                        : "text-[#181818]"
                                }`}
                            >
                                ZS CODE{" "}
                                <span className="text-purple-600">
                                    V1.0
                                </span>
                            </h1>

                            <p
                                className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-[15px] ${
                                    isDark
                                        ? "text-white/50"
                                        : "text-slate-600"
                                }`}
                            >
                                ZS Code is a developer workspace built to
                                bring coding, projects, AI assistance and
                                development tools together in one place.
                            </p>
                        </div>

                        {/* Current Capabilities */}
                        <section className="mt-10">
                            <div className="mb-4">
                                <p
                                    className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${
                                        isDark
                                            ? "text-purple-400"
                                            : "text-purple-700"
                                    }`}
                                >
                                    Available Now
                                </p>

                                <h2
                                    className={`mt-1 text-xl font-semibold ${
                                        isDark
                                            ? "text-white"
                                            : "text-slate-900"
                                    }`}
                                >
                                    What ZS Code can do
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {currentFeatures.map((feature) => (
                                    <div
                                        key={feature}
                                        className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 ${
                                            isDark
                                                ? "border-white/10 bg-white/[0.03]"
                                                : "border-black/10 bg-slate-50"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                                isDark
                                                    ? "bg-green-500/10 text-green-400"
                                                    : "bg-green-100 text-green-700"
                                            }`}
                                        >
                                            <FaCheck size={10} />
                                        </div>

                                        <span
                                            className={`text-sm ${
                                                isDark
                                                    ? "text-white/75"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Current V1.0 Note */}
                        <div
                            className={`mt-7 rounded-xl border p-4 ${
                                isDark
                                    ? "border-purple-400/10 bg-purple-500/[0.05]"
                                    : "border-purple-200 bg-purple-50"
                            }`}
                        >
                            <p
                                className={`text-sm leading-6 ${
                                    isDark
                                        ? "text-white/55"
                                        : "text-slate-600"
                                }`}
                            >
                                <span
                                    className={`font-semibold ${
                                        isDark
                                            ? "text-purple-300"
                                            : "text-purple-700"
                                    }`}
                                >
                                    V1.0:
                                </span>{" "}
                                ZS Code currently focuses on web development
                                with HTML, CSS and JavaScript, together with
                                its editor, project workspace, preview,
                                terminal and AI-powered workflow.
                            </p>
                        </div>

                        {/* Roadmap */}
                        <section className="mt-10">
                            <div className="mb-5">
                                <p
                                    className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${
                                        isDark
                                            ? "text-blue-400"
                                            : "text-blue-700"
                                    }`}
                                >
                                    Roadmap
                                </p>

                                <h2
                                    className={`mt-1 text-xl font-semibold ${
                                        isDark
                                            ? "text-white"
                                            : "text-slate-900"
                                    }`}
                                >
                                    Coming Next
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {upcomingFeatures.map(
                                    ({
                                        icon: Icon,
                                        title,
                                        description,
                                    }) => (
                                        <div
                                            key={title}
                                            className={`flex gap-4 rounded-xl border p-4 ${
                                                isDark
                                                    ? "border-white/10 bg-white/[0.025]"
                                                    : "border-black/10 bg-white"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                    isDark
                                                        ? "bg-blue-500/10 text-blue-400"
                                                        : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3
                                                        className={`text-sm font-semibold ${
                                                            isDark
                                                                ? "text-white"
                                                                : "text-slate-900"
                                                        }`}
                                                    >
                                                        {title}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                                                            isDark
                                                                ? "bg-blue-500/10 text-blue-300"
                                                                : "bg-blue-50 text-blue-700"
                                                        }`}
                                                    >
                                                        Planned
                                                    </span>
                                                </div>

                                                <p
                                                    className={`mt-1 text-sm leading-6 ${
                                                        isDark
                                                            ? "text-white/45"
                                                            : "text-slate-500"
                                                    }`}
                                                >
                                                    {description}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        {/* Founder */}
                        <section className="mt-11 text-center">
                            <div
                                className={`mx-auto mb-6 h-px w-24 ${
                                    isDark
                                        ? "bg-white/10"
                                        : "bg-black/10"
                                }`}
                            />

                            <p
                                className={`text-[11px] font-medium uppercase tracking-[0.28em] ${
                                    isDark
                                        ? "text-white/35"
                                        : "text-slate-400"
                                }`}
                            >
                                Founder of ZS Code
                            </p>

                            {/* Profile Image */}
                            <div className="mt-5 flex justify-center">
                                <div className="rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-purple-600 p-[2px]">
                                    <div
                                        className={`rounded-full p-1 ${
                                            isDark
                                                ? "bg-[#181818]"
                                                : "bg-white"
                                        }`}
                                    >
                                        <img
                                            src="/me.jpeg"
                                            alt="Muhammad Zaeem Ahmad"
                                            className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
                                        />
                                    </div>
                                </div>
                            </div>

                            <h2
                                className={`mt-5 text-xl font-semibold sm:text-2xl ${
                                    isDark
                                        ? "text-white"
                                        : "text-slate-900"
                                }`}
                            >
                                Muhammad Zaeem Ahmad
                            </h2>

                            <p
                                className={`mt-2 text-sm ${
                                    isDark
                                        ? "text-white/45"
                                        : "text-slate-500"
                                }`}
                            >
                                AI-Powered Full-Stack Developer
                            </p>

                            <p
                                className={`mx-auto mt-4 max-w-xl text-sm leading-6 ${
                                    isDark
                                        ? "text-white/40"
                                        : "text-slate-500"
                                }`}
                            >
                                Building ZS Code as a developer-focused
                                platform for creating and managing modern
                                software projects with AI-powered development
                                workflows.
                            </p>

                            {/* Social Links */}
                            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                                <a
                                    href="https://www.linkedin.com/in/muhammad-zaeem-ahmad-06a5a0363/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
                                        isDark
                                            ? "border-white/10 text-white/60 hover:border-blue-400/30 hover:bg-white/5 hover:text-white"
                                            : "border-black/10 text-slate-600 hover:border-blue-400 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <FaLinkedin size={14} />
                                    LinkedIn
                                    <FaExternalLinkAlt
                                        size={8}
                                        className="opacity-40 group-hover:opacity-100"
                                    />
                                </a>

                                <a
                                    href="https://github.com/chzaeem47"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
                                        isDark
                                            ? "border-white/10 text-white/60 hover:border-purple-400/30 hover:bg-white/5 hover:text-white"
                                            : "border-black/10 text-slate-600 hover:border-purple-400 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <FaGithub size={14} />
                                    GitHub
                                    <FaExternalLinkAlt
                                        size={8}
                                        className="opacity-40 group-hover:opacity-100"
                                    />
                                </a>

                                <a
                                    href="https://learn.microsoft.com/en-us/users/zaeemshahid-8755/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
                                        isDark
                                            ? "border-white/10 text-white/60 hover:border-orange-400/30 hover:bg-white/5 hover:text-white"
                                            : "border-black/10 text-slate-600 hover:border-orange-400 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <FaBook size={14} />
                                    Microsoft Learn
                                    <FaExternalLinkAlt
                                        size={8}
                                        className="opacity-40 group-hover:opacity-100"
                                    />
                                </a>
                            </div>
                        </section>

                        {/* Footer */}
                        <div
                            className={`mt-9 border-t pt-5 text-center text-xs ${
                                isDark
                                    ? "border-white/10 text-white/25"
                                    : "border-black/10 text-slate-400"
                            }`}
                        >
                            ZS Code V1.0 · Built for developers
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPopup;