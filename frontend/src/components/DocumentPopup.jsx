import { useEffect } from "react";
import {
    FaLinkedin,
    FaGithub,
    FaCode,
} from "react-icons/fa";
import { SiFiverr } from "react-icons/si";
import { CiCircleList } from "react-icons/ci";
import { FaPhoenixFramework } from "react-icons/fa6";
import { GiRobotLeg } from "react-icons/gi";
import { VscTools } from "react-icons/vsc";
import { GoTools } from "react-icons/go";

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
            color: "text-cyan-400",
            hover: "group-hover:text-cyan-300",
        },
        {
            icon: FaPhoenixFramework,
            title: "Framework Support",
            description:
                "Bring modern frameworks and libraries into the ZS Code development workflow.",
            color: "text-red-500",
            hover: "group-hover:text-purple-300",
        },
        {
            icon: GiRobotLeg,
            title: "Smarter AI",
            description:
                "Improve the AI coding experience with better generation, understanding and project assistance.",
            color: "text-amber-400",
            hover: "group-hover:text-amber-300",
        },
        {
            icon: GoTools,
            title: "Developer Tools",
            description:
                "Add more tools for debugging, testing, project management and development workflows.",
            color: "text-emerald-400",
            hover: "group-hover:text-emerald-300",
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
                className={`absolute inset-0 backdrop-blur-md ${isDark ? "bg-black/70" : "bg-black/40"
                    }`}
            />

            {/* Popup */}
            <div
                className={`relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border p-1 shadow-2xl ${isDark
                        ? "border-white/10 bg-[#181818] text-white"
                        : "border-black/10 bg-white text-[#181818]"
                    }`}
            >
                {/* Mac Controls */}
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="h-3 w-3 rounded-full bg-red-500 transition-transform duration-200 hover:scale-125"
                    />
                    <button
                        onClick={onClose}
                        aria-label="Minimize"
                        className="h-3 w-3 rounded-full bg-yellow-400 transition-transform duration-200 hover:scale-125"
                    />
                    <button
                        onClick={onClose}
                        aria-label="Maximize"
                        className="h-3 w-3 rounded-full bg-green-500 transition-transform duration-200 hover:scale-125"
                    />
                </div>
                {/* Scrollable Content */}
                <div className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="px-6 py-9 sm:px-10 sm:py-10">

                        {/* Hero */}
                        <div className="text-center">
                            <p
                                className={`font-plex mb-5 text-[14px] font-medium uppercase tracking-[0.3em] ${isDark
                                    ? "text-white/40"
                                    : "text-slate-400"
                                    }`}
                            >
                                Developer Workspace
                            </p>

                            <h1
                                className={`text-5xl font-tangerine font-extrabold tracking-widest sm:text-5xl ${isDark
                                    ? "bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-pink-500 via-purple-600 via-blue-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                                    : "text-[#181818]"
                                    }`}
                            >
                                ZS CODE{" "}
                                <span className="text-blue-600">
                                    V{""}
                                </span>
                                <span className="text-4xl font-serif ml-1">1.0</span>
                            </h1>

                            <p
                                className={`mx-auto mt-4 max-w-2xl text-sm leading-7 font-plex tracking-wider sm:text-[15px] ${isDark
                                    ? "text-white/50"
                                    : "text-slate-600"
                                    }`}
                            >
                                ZS Code is a developer workspace built to
                                bring coding projects AI assistance and
                                development tools together in one place
                            </p>
                        </div>

                        {/* Current Capabilities */}
                        <section className="mt-10">
                            <div className="mb-4">
                                <p
                                    className={`text-[15px] font-semibold italic font-plex uppercase tracking-[0.15em] ${isDark
                                        ? "text-blue-400"
                                        : "text-purple-700"
                                        }`}
                                >
                                    Current Capabilities
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                {currentFeatures.map((feature) => (
                                    <div
                                        key={feature}
                                        className="font-plex tracking-wider group flex items-center gap-2.5 transition-all duration-300 hover:translate-x-1"
                                    >
                                        <CiCircleList size={25} className="text-blue-400" />

                                        <span
                                            className={`text-sm font-medium transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:via-blue-400 group-hover:to-violet-400 group-hover:bg-clip-text group-hover:text-transparent ${isDark ? "text-white/75" : "text-slate-700"
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
                            className={`mt-7 rounded-xl border p-4 ${isDark
                                ? "border-purple-400/10 bg-blue-500/70"
                                : "border-purple-200 bg-purple-50"
                                }`}
                        >
                            <p
                                className={`font-plex tracking-wider text-sm leading-6 ${isDark
                                    ? "text-white"
                                    : "text-slate-600"
                                    }`}
                            >
                                ZS Code currently focuses on web development
                                with HTML CSS and JavaScript together with
                                its editor project workspace preview
                                terminal and AI-powered workflow
                            </p>
                        </div>

                        {/* Roadmap */}
                        <section className="mt-10">
                            <div className="mb-5">
                                <h2
                                    className={`font-plex italic mt-1 text-xl font-semibold ${isDark
                                        ? "text-white"
                                        : "text-slate-900"
                                        }`}
                                >
                                    ~ Coming Next
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {upcomingFeatures.map(({ icon: Icon, title, description, color, hover }) => (
                                    <div
                                        key={title}
                                        className="group flex gap-4"
                                    >
                                        <div
                                            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center transition-all duration-300 ${color} ${hover}`}
                                        >
                                            <Icon size={35} strokeWidth={1.7} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    className={`font-plex text-[18px] font-semibold tracking-wider transition-colors ${isDark
                                                        ? "text-white/85 group-hover:text-white"
                                                        : "text-slate-800 group-hover:text-slate-950"
                                                        }`}
                                                >
                                                    {title}
                                                </h3>

                                                <span
                                                    className={`font-plex text-[11px] font-medium italic uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-slate-400"
                                                        }`}
                                                >
                                                    Planned
                                                </span>
                                            </div>

                                            <p
                                                className={`font-serif mt-1.5 max-w-xl text-[13px] leading-6 tracking-wider ${isDark
                                                    ? "text-white/60"
                                                    : "text-slate-500"
                                                    }`}
                                            >
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Founder */}
                        <section className="mt-11 text-center">
                            <div
                                className={`mx-auto mb-10 h-px w-80 ${isDark
                                    ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                                    : "bg-gradient-to-r from-transparent via-slate-300 to-transparent"
                                    }`}
                            />
                            <p
                                className={`text-[20px] font-bold italic font-medium tracking-[0.2rem] bg-gradient-to-r ${isDark
                                    ? "from-[#f8be02] via-[#ffc927] to-[#ffb700]"
                                    : "from-[#A67C00] via-[#D4AF37] to-[#8C6500]"
                                    } bg-clip-text text-transparent`}
                            >
                                Founder of ZS Code
                            </p>

                            <div className="mt-6 ml-25 flex items-center justify-center gap-6">
                                {/* Signature */}
                                <div className="flex items-center justify-center">
                                    <img
                                        src="/sign.png"
                                        alt="Muhammad Zaeem Ahmad signature"
                                        className={`invert-100 w-38 sm:w-55 object-contain ${isDark ? "opacity-90" : "opacity-80"
                                            }`}
                                    />
                                </div>

                                {/* Vertical divider */}
                                <div
                                    className={`h-16 w-px ${isDark
                                        ? "bg-gradient-to-b from-transparent via-[#C9A227]/50 to-transparent"
                                        : "bg-gradient-to-b from-transparent via-[#C9A227]/40 to-transparent"
                                        }`}
                                />

                                {/* Name + Role */}
                                <div className="text-left">
                                    <h2
                                        className={`font-plex text-xl font-semibold tracking-wide sm:text-2xl ${isDark ? "text-white" : "text-slate-900"
                                            }`}
                                    >
                                        Muhammad Zaeem Ahmad
                                    </h2>

                                    <p
                                        className={`font-cookie mt-1 text-sm ${isDark ? "text-blue-400" : "text-slate-500"
                                            }`}
                                    >
                                        AI-Powered Full-Stack Developer
                                    </p>
                                </div>
                            </div>

                            <p
                                className={`font-plex tracking-wider mx-auto mt-4 max-w-xl text-sm leading-6 ${isDark
                                    ? "text-white/40"
                                    : "text-slate-500"
                                    }`}
                            >
                                Building ZS Code as a developer focused
                                platform for creating and managing modern
                                software projects with AI-powered development
                                workflows
                            </p>

                            {/* Social Links */}
                            <div className="mt-6 flex items-center justify-center gap-3">
                                {/* LinkedIn */}
                                <a
                                    href="https://www.linkedin.com/in/muhammad-zaeem-ahmad-06a5a0363/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                    className="group flex h-10 w-15 items-center justify-center rounded-full bg-[#0A66C2] text-white transition-all duration-300 hover:-translate-y-1"
                                >
                                    <FaLinkedin size={28} />
                                </a>

                                {/* GitHub */}
                                <a
                                    href="https://github.com/chzaeem47"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub"
                                    className={`group flex h-10 w-15 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-1 ${isDark
                                        ? "bg-[#2c2b2b] text-white"
                                        : "bg-[#18181B] text-white"
                                        }`}
                                >
                                    <FaGithub size={30} />
                                </a>

                                {/* Fiverr */}
                                <a
                                    href="#"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Fiverr"
                                    className="group flex h-10 w-15 items-center justify-center rounded-full bg-[#1DBF73] text-white transition-all duration-300 hover:-translate-y-1"
                                >
                                    <SiFiverr size={40} />
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPopup;