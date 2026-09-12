import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes,
    FaArrowUp,
    FaSpinner,
    FaCheck,
    FaFolder,
    FaFile,
    FaCode,
    FaWrench,
    FaCircle
} from "react-icons/fa";

import { useTheme } from "../context/ThemeContext";
import MetallicPaint from "./MetallicPaint";
import logo from "../assets/zs-ai-metallic-logo.svg";
import { GiSplitCross } from "react-icons/gi";
import { getFileTree } from "../features/file";


// ------------------------------------------------------------
// Tool labels
// ------------------------------------------------------------

const getToolLabel = (tool, args = {}) => {
    const fileName =
        args?.name ||
        args?.fileName ||
        args?.path ||
        args?.file ||
        "";

    switch (tool) {
        case "get_tree":
            return "Inspecting project";

        case "get_file":
            return fileName
                ? `Reading ${fileName}`
                : "Reading file";

        case "create_file":
            return fileName
                ? `Creating ${fileName}`
                : "Creating file";

        case "update_file":
            return fileName
                ? `Updating ${fileName}`
                : "Updating file";

        case "delete_file":
            return fileName
                ? `Deleting ${fileName}`
                : "Deleting file";

        case "create_folder":
            return fileName
                ? `Creating folder ${fileName}`
                : "Creating folder";

        default:
            return tool
                ? `Using ${tool.replace(/_/g, " ")}`
                : "Working";
    }
};


// ------------------------------------------------------------
// Friendly operation labels
// ------------------------------------------------------------

const getOperationLabel = (eventType, data) => {
    const name =
        data?.file?.name ||
        data?.folder?.name ||
        data?.name ||
        data?.fileName ||
        "item";

    switch (eventType) {
        case "file_created":
            return `✓ ${name} created`;

        case "folder_created":
            return `✓ ${name} folder created`;

        case "file_updated":
            return `✓ ${name} updated`;

        case "file_deleted":
            return `✓ ${name} deleted`;

        default:
            return null;
    }
};


// ------------------------------------------------------------
// Parse one SSE frame
// ------------------------------------------------------------

const parseSSEFrame = (frame) => {
    const lines = frame.split(/\r?\n/);

    let event = "message";
    let data = "";

    for (const line of lines) {
        if (line.startsWith("event:")) {
            event = line.slice(6).trim();
        }

        if (line.startsWith("data:")) {
            data += line.slice(5).trim();
        }
    }

    if (!data) {
        return null;
    }

    try {
        return {
            event,
            data: JSON.parse(data)
        };
    } catch {
        return {
            event,
            data: {
                content: data
            }
        };
    }
};


// ------------------------------------------------------------
// AI Chat Panel
// ------------------------------------------------------------

const AIChatPanel = ({ isOpen, onClose }) => {
    const { isDark } = useTheme();

    const [currentProject, setCurrentProject] = useState(null);

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);

    const [activities, setActivities] = useState([]);

    const [isWorking, setIsWorking] = useState(false);

    const [completed, setCompleted] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const scrollRef = useRef(null);
    const abortControllerRef = useRef(null);

    // --------------------------------------------------------
    // Receive the currently opened project
    // --------------------------------------------------------

    useEffect(() => {
        const handleOpenProject = (event) => {
            const project = event.detail || null;

            setCurrentProject(project);

            // New project = new AI conversation
            setMessages([]);
            setActivities([]);
            setCompleted(false);
            setErrorMessage("");
        };

        const handleDeletedProjects = (event) => {
            const ids = event.detail?.projectIds || [];

            setCurrentProject((previous) => {
                if (!previous) return null;

                if (ids.includes(previous._id)) {
                    return null;
                }

                return previous;
            });
        };

        window.addEventListener(
            "zs-code-open-project",
            handleOpenProject
        );

        window.addEventListener(
            "zs-code-projects-deleted",
            handleDeletedProjects
        );

        return () => {
            window.removeEventListener(
                "zs-code-open-project",
                handleOpenProject
            );

            window.removeEventListener(
                "zs-code-projects-deleted",
                handleDeletedProjects
            );
        };
    }, []);


    // --------------------------------------------------------
    // Auto scroll
    // --------------------------------------------------------

    useEffect(() => {
        if (!scrollRef.current) return;

        scrollRef.current.scrollTop =
            scrollRef.current.scrollHeight;
    }, [messages, activities, isWorking]);


    // --------------------------------------------------------
    // Cleanup stream when component disappears
    // --------------------------------------------------------

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);


    // --------------------------------------------------------
    // Add activity
    // --------------------------------------------------------

    const addActivity = (activity) => {
        setActivities((previous) => [
            ...previous,
            {
                id: `${Date.now()}-${Math.random()}`,
                ...activity
            }
        ]);
    };


    // --------------------------------------------------------
    // Mark latest tool activity complete
    // --------------------------------------------------------

    const completeToolActivity = (tool) => {
        setActivities((previous) => {
            const next = [...previous];

            for (let i = next.length - 1; i >= 0; i--) {
                if (
                    next[i].tool === tool &&
                    next[i].status === "working"
                ) {
                    next[i] = {
                        ...next[i],
                        status: "completed"
                    };

                    break;
                }
            }

            return next;
        });
    };


    // --------------------------------------------------------
    // Dispatch file-tree update
    // --------------------------------------------------------

    const notifyFileTreeChanged=(eventType,data)=>{
    const detail={
        projectId:currentProject?._id||null,
        eventType,
        ...data
    };
    window.dispatchEvent(new CustomEvent("zs-code-file-tree-changed",{detail}));
    window.dispatchEvent(new CustomEvent("zs-code-preview-changed",{detail}));
};


    // --------------------------------------------------------
    // Process SSE event
    // --------------------------------------------------------

    const handleSSEEvent = (eventType, data) => {

        // ----------------------------------------------------
        // AI started
        // ----------------------------------------------------

        if (eventType === "start") {
            setIsWorking(true);
            setCompleted(false);
            setErrorMessage("");

            window.dispatchEvent(
                new CustomEvent("zs-code-ai-run-started", {
                    detail: {
                        projectId: currentProject?._id || null
                    }
                })
            );

            return;
        }


        // ----------------------------------------------------
        // Tool started
        // ----------------------------------------------------

        if (eventType === "tool_start") {
            const tool = data?.tool || "unknown";
            const args = data?.args || {};

            addActivity({
                type: "tool",
                tool,
                args,
                label: getToolLabel(tool, args),
                status: "working"
            });

            return;
        }


        // ----------------------------------------------------
        // Normal AI message
        // ----------------------------------------------------

        if (eventType === "message") {
            const content = data?.content;

            if (!content) return;

            setMessages((previous) => {

                const last =
                    previous[previous.length - 1];

                // If AI has already started a message,
                // replace the previous streaming message.
                if (
                    last?.role === "assistant" &&
                    last?.streaming
                ) {
                    return [
                        ...previous.slice(0, -1),
                        {
                            ...last,
                            content
                        }
                    ];
                }

                return [
                    ...previous,
                    {
                        role: "assistant",
                        content,
                        streaming: true
                    }
                ];
            });

            return;
        }


        // ----------------------------------------------------
        // File created / updated / deleted
        // ----------------------------------------------------

        if (
            eventType === "file_created" ||
            eventType === "folder_created" ||
            eventType === "file_updated" ||
            eventType === "file_deleted"
        ) {

            const operationLabel =
                getOperationLabel(eventType, data);

            if (operationLabel) {
                addActivity({
                    type: "file",
                    eventType,
                    label: operationLabel,
                    status: "completed",
                    data
                });
            }


            // Complete the matching tool
            if (eventType === "file_created") {
                completeToolActivity("create_file");
            }

            if (eventType === "folder_created") {
                completeToolActivity("create_folder");
            }

            if (eventType === "file_updated") {
                completeToolActivity("update_file");
            }

            if (eventType === "file_deleted") {
                completeToolActivity("delete_file");
            }


            // Tell FileExplorer to reload immediately
            notifyFileTreeChanged(eventType, data);

            return;
        }


        // ----------------------------------------------------
        // Generic tool result
        // ----------------------------------------------------

        if (eventType === "tool_result") {
            return;
        }


        // ----------------------------------------------------
        // Completed
        // ----------------------------------------------------

        if (eventType === "done") {

            setActivities((previous) =>
                previous.map((activity) =>
                    activity.status === "working"
                        ? {
                            ...activity,
                            status: "completed"
                        }
                        : activity
                )
            );

            setMessages((previous) =>
                previous.map((message) =>
                    message.streaming
                        ? {
                            ...message,
                            streaming: false
                        }
                        : message
                )
            );


            // Backend's final message
            if (data?.message) {
                setMessages((previous) => {

                    const last =
                        previous[previous.length - 1];

                    if (
                        last?.role === "assistant" &&
                        last.content === data.message
                    ) {
                        return previous.map((message, index) =>
                            index === previous.length - 1
                                ? {
                                    ...message,
                                    streaming: false
                                }
                                : message
                        );
                    }

                    return [
                        ...previous,
                        {
                            role: "assistant",
                            content: data.message,
                            streaming: false,
                            final: true
                        }
                    ];
                });
            }


            addActivity({
                type: "done",
                label: "✓ Project completed",
                status: "completed"
            });

            setCompleted(true);
            setIsWorking(false);

            return;
        }


        // ----------------------------------------------------
        // Error
        // ----------------------------------------------------

        if (eventType === "error") {

            const message =
                data?.message ||
                "The AI agent encountered an error.";

            setErrorMessage(message);

            setActivities((previous) =>
                previous.map((activity) =>
                    activity.status === "working"
                        ? {
                            ...activity,
                            status: "error"
                        }
                        : activity
                )
            );

            setIsWorking(false);

            return;
        }
    };


    // --------------------------------------------------------
    // Send prompt
    // --------------------------------------------------------

    const handleSend = async () => {
        const cleanMessage = input.trim();

        if (!cleanMessage) return;

        if (isWorking) return;

        if (!currentProject?._id) {
            setErrorMessage(
                "Please open a project before asking ZS Code to work."
            );

            return;
        }


        const userMessage = {
            role: "user",
            content: cleanMessage
        };


        // Add user message immediately
        setMessages((previous) => [
            ...previous,
            userMessage
        ]);

        setInput("");

        setActivities([]);

        setCompleted(false);

        setErrorMessage("");

        setIsWorking(true);


        // ----------------------------------------------------
        // History sent to backend
        // ----------------------------------------------------

        const history = messages
            .filter(message => message.role === "user" || message.role === "assistant")
            .map(message => ({ role: message.role, content: message.content }));

        let projectContext = null;
        try {
            const tree = await getFileTree(currentProject._id);
            const compact = (nodes = []) => nodes.map(node => ({
                _id: node._id || node.id,
                parentId: node.parentId ?? null,
                name: node.name,
                type: node.type,
                language: node.language,
                extension: node.extension,
                children: compact(node.children || [])
            }));
            const compactTree = compact(Array.isArray(tree) ? tree : []);
            const root = compactTree.find(node => node.type === "folder" && node.parentId == null) || compactTree[0] || null;
            const flatten = nodes => nodes.flatMap(node => [node, ...(node.children || []).length ? flatten(node.children) : []]);
            const flat = flatten(compactTree);
            projectContext = {
                rootFolderId: root?._id || currentProject._id,
                rootFolderName: root?.name || currentProject.name || "Project",
                hasFiles: flat.some(node => node.type === "file"),
                files: flat.filter(node => node.type === "file").map(file => ({ _id: file._id, parentId: file.parentId, name: file.name, language: file.language, extension: file.extension }))
            };
        } catch (contextError) {
            console.warn("Unable to build AI project context:", contextError);
        }

        abortControllerRef.current = new AbortController();


        try {

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/ai/chat`,
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        projectId: currentProject._id,
                        message: cleanMessage,
                        history,
                        projectContext
                    }),

                    signal: abortControllerRef.current.signal
                }
            );


            if (!response.ok) {
                let message =
                    `AI request failed (${response.status})`;

                try {
                    const body =
                        await response.json();

                    message =
                        body?.message || message;
                } catch {
                    // Ignore JSON parsing failure
                }

                throw new Error(message);
            }


            if (!response.body) {
                throw new Error(
                    "This browser does not support streaming responses."
                );
            }


            // ------------------------------------------------
            // Read SSE stream
            // ------------------------------------------------

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder("utf-8");

            let buffer = "";


            while (true) {

                const { value, done } =
                    await reader.read();

                if (done) break;


                buffer += decoder.decode(
                    value,
                    { stream: true }
                );


                // SSE frames end with a blank line
                const frames =
                    buffer.split(/\r?\n\r?\n/);


                // Last item may be incomplete
                buffer = frames.pop() || "";


                for (const frame of frames) {

                    const parsed =
                        parseSSEFrame(frame);

                    if (!parsed) continue;

                    handleSSEEvent(
                        parsed.event,
                        parsed.data
                    );
                }
            }


            // ------------------------------------------------
            // Process final incomplete frame if necessary
            // ------------------------------------------------

            if (buffer.trim()) {

                const parsed =
                    parseSSEFrame(buffer);

                if (parsed) {
                    handleSSEEvent(
                        parsed.event,
                        parsed.data
                    );
                }
            }

        } catch (error) {

            if (error?.name === "AbortError") {
                return;
            }

            console.error(
                "AI streaming error:",
                error
            );

            setErrorMessage(
                error?.message ||
                "Unable to connect to ZS Code."
            );

            setIsWorking(false);
        }
    };


    // --------------------------------------------------------
    // Enter to send
    // --------------------------------------------------------

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
        }
    };


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 32
                    }}
                    className={`fixed right-0 top-[50px] z-[45] flex h-[calc(100vh-50px)] w-[390px] max-w-[92vw] flex-col overflow-hidden border-l ${isDark
                        ? "border-white/[0.08] bg-[#181818]"
                        : "border-black/[0.08] bg-[#f8f8f8]"
                        }`}
                >

                    {/* ------------------------------------------------ */}
                    {/* HEADER */}
                    {/* ------------------------------------------------ */}

                    <header className="flex h-12 shrink-0 items-center justify-between px-3">

                        <div
                            className={`font-plex text-[12px] tracking-wide ${isDark
                                ? "text-white/45"
                                : "text-slate-400"
                                }`}
                        >
                            ZS Code Agent
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close AI chat"
                            className="flex h-8 w-8 items-center justify-center rounded-md"
                        >
                            <GiSplitCross
                                className="text-[18px] transition-transform duration-200 hover:scale-115 hover:text-red-500"
                            />
                        </button>

                    </header>


                    {/* ------------------------------------------------ */}
                    {/* CONTENT */}
                    {/* ------------------------------------------------ */}

                    <div
                        ref={scrollRef}
                        className="ai-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4"
                    >

                        {/* Empty state */}
                        {messages.length === 0 &&
                            activities.length === 0 && (
                                <div className="flex h-full min-h-[350px] flex-col items-center justify-center">

                                    <div className="relative h-[220px] w-[220px]">

                                        <MetallicPaint
                                            imageSrc={logo}
                                            seed={42}
                                            scale={4}
                                            patternSharpness={1}
                                            noiseScale={0.5}
                                            speed={0.3}
                                            liquid={0.75}
                                            mouseAnimation={false}
                                            brightness={2}
                                            contrast={0.5}
                                            refraction={0.01}
                                            blur={0.015}
                                            chromaticSpread={2}
                                            fresnel={1}
                                            angle={0}
                                            waveAmplitude={1}
                                            distortion={1}
                                            contour={0.2}
                                            lightColor="#FF11FF"
                                            darkColor="#062B2B"
                                            tintColor="#00D9A5"
                                        />

                                    </div>

                                    <p
                                        className={`mt-2 font-plex text-[12px] ${isDark
                                            ? "text-white/30"
                                            : "text-slate-400"
                                            }`}
                                    >
                                        Ask ZS Code to build something
                                    </p>

                                </div>
                            )}


                        {/* ------------------------------------------------ */}
                        {/* CHAT MESSAGES */}
                        {/* ------------------------------------------------ */}

                        <div className="space-y-3 pt-2">

                            {messages.map(
                                (message, index) => {

                                    const isUser =
                                        message.role === "user";

                                    return (
                                        <div
                                            key={`${index}-${message.role}`}
                                            className={`flex ${isUser
                                                ? "justify-end"
                                                : "justify-start"
                                                }`}
                                        >

                                            <div
                                                className={`max-w-[90%] rounded-2xl px-3 py-2 font-plex text-[13px] leading-relaxed ${isUser
                                                    ? isDark
                                                        ? "bg-white/[0.10] text-white"
                                                        : "bg-black/[0.07] text-slate-900"
                                                    : isDark
                                                        ? "bg-[#232323] text-white/80"
                                                        : "bg-white text-slate-700 shadow-sm"
                                                    }`}
                                            >
                                                <div className="whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </div>
                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>


                        {/* ------------------------------------------------ */}
                        {/* AI WORKING */}
                        {/* ------------------------------------------------ */}

                        {(isWorking ||
                            activities.length > 0) && (

                                <div
                                    className={`mt-4 overflow-hidden rounded-2xl border ${isDark
                                        ? "border-white/[0.07] bg-[#202020]"
                                        : "border-black/[0.07] bg-white"
                                        }`}
                                >

                                    {/* Working header */}

                                    {isWorking && (
                                        <div
                                            className={`flex items-center gap-2 border-b px-3 py-2.5 ${isDark
                                                ? "border-white/[0.06]"
                                                : "border-black/[0.06]"
                                                }`}
                                        >

                                            <FaSpinner
                                                className="animate-spin text-[12px]"
                                            />

                                            <span
                                                className={`font-plex text-[12px] ${isDark
                                                    ? "text-white/70"
                                                    : "text-slate-600"
                                                    }`}
                                            >
                                                AI is working...
                                            </span>

                                        </div>
                                    )}


                                    {/* Activities */}

                                    <div className="space-y-1.5 p-2">

                                        {activities.map(
                                            (activity) => (

                                                <div
                                                    key={activity.id}
                                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isDark
                                                        ? "bg-white/[0.025]"
                                                        : "bg-black/[0.025]"
                                                        }`}
                                                >

                                                    {/* Icon */}

                                                    <div className="flex w-4 shrink-0 justify-center">

                                                        {activity.status === "working" ? (

                                                            <FaSpinner
                                                                className="animate-spin text-[10px]"
                                                            />

                                                        ) : activity.status === "error" ? (

                                                            <FaCircle
                                                                className="text-[7px] text-red-400"
                                                            />

                                                        ) : activity.type === "file" ? (

                                                            activity.eventType === "folder_created" ? (
                                                                <FaFolder className="text-[10px]" />
                                                            ) : (
                                                                <FaFile className="text-[10px]" />
                                                            )

                                                        ) : activity.type === "done" ? (

                                                            <FaCheck className="text-[10px]" />

                                                        ) : (

                                                            <FaWrench className="text-[10px]" />

                                                        )}

                                                    </div>


                                                    {/* Label */}

                                                    <span
                                                        className={`min-w-0 truncate font-plex text-[11px] ${activity.status === "working"
                                                            ? isDark
                                                                ? "text-white/70"
                                                                : "text-slate-600"
                                                            : isDark
                                                                ? "text-white/45"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {activity.label}
                                                    </span>

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}


                        {/* ------------------------------------------------ */}
                        {/* ERROR */}
                        {/* ------------------------------------------------ */}

                        {errorMessage && (

                            <div
                                className={`mt-3 rounded-xl border px-3 py-2 font-plex text-[11px] ${isDark
                                    ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
                                    : "border-red-300 bg-red-50 text-red-600"
                                    }`}
                            >
                                {errorMessage}
                            </div>

                        )}


                        {/* ------------------------------------------------ */}
                        {/* COMPLETED */}
                        {/* ------------------------------------------------ */}

                        {completed && !errorMessage && (

                            <div
                                className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 font-plex text-[11px] ${isDark
                                    ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300"
                                    : "border-emerald-300 bg-emerald-50 text-emerald-600"
                                    }`}
                            >
                                <FaCheck className="text-[10px]" />

                                <span>
                                    Command completed successfully.
                                </span>
                            </div>

                        )}

                    </div>


                    {/* ------------------------------------------------ */}
                    {/* INPUT */}
                    {/* ------------------------------------------------ */}

                    <div className="shrink-0 px-4 pb-4 pt-3">

                        <div
                            className={`relative flex min-h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${isDark
                                ? "border-white/[0.09] bg-[#2d2a2a]"
                                : "border-black/[0.09] bg-white"
                                }`}
                        >

                            <input
                                type="text"
                                value={input}
                                onChange={(event) =>
                                    setInput(event.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                disabled={isWorking}
                                placeholder={
                                    currentProject
                                        ? "Ask ZS Code..."
                                        : "Open a project first..."
                                }
                                className={`min-w-0 flex-1 bg-transparent pr-10 font-plex text-[14px] outline-none ${isDark
                                    ? "text-white placeholder:text-white/30"
                                    : "text-slate-900 placeholder:text-slate-400"
                                    } ${isWorking
                                        ? "cursor-not-allowed opacity-50"
                                        : ""
                                    }`}
                            />


                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={
                                    !input.trim() ||
                                    isWorking ||
                                    !currentProject?._id
                                }
                                aria-label="Send message"
                                className={`absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${!input.trim() ||
                                    isWorking ||
                                    !currentProject?._id
                                    ? isDark
                                        ? "bg-white/[0.06] text-white/20"
                                        : "bg-black/[0.05] text-slate-300"
                                    : isDark
                                        ? "bg-white text-black hover:bg-white/90"
                                        : "bg-black text-white hover:bg-black/85"
                                    }`}
                            >

                                {isWorking ? (
                                    <FaSpinner className="animate-spin text-[11px]" />
                                ) : (
                                    <FaArrowUp className="text-[12px]" />
                                )}

                            </button>

                        </div>

                    </div>

                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default AIChatPanel;