import { useEffect, useRef, useState } from "react";
import { FaTerminal, FaTimes, FaExpandAlt } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const Terminal = ({ isOpen, onClose }) => {
    const { isDark } = useTheme();

    const [input, setInput] = useState("");

    const [history, setHistory] = useState([
        {
            type: "system",
            text: "ZS Code Terminal",
        },
        {
            type: "system",
            text: 'Type "help" to see available commands.',
        },
    ]);

    const [currentPath, setCurrentPath] = useState("~");
    const [maximized, setMaximized] = useState(false);

    const inputRef = useRef(null);
    const terminalBodyRef = useRef(null);

    // Focus terminal input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 250);
        }
    }, [isOpen]);

    // Automatically scroll terminal to bottom
    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop =
                terminalBodyRef.current.scrollHeight;
        }
    }, [history]);

    const addOutput = (text, type = "output") => {
        setHistory((prev) => [
            ...prev,
            {
                type,
                text,
            },
        ]);
    };

    const executeCommand = (command) => {
        const trimmedCommand = command.trim();

        if (!trimmedCommand) {
            return;
        }

        // Show entered command
        setHistory((prev) => [
            ...prev,
            {
                type: "command",
                text: trimmedCommand,
                path: currentPath,
            },
        ]);

        const [cmd, ...args] = trimmedCommand.split(/\s+/);

        switch (cmd.toLowerCase()) {
            case "help":
                addOutput(
                    [
                        "Available commands:",
                        "",
                        "  help       Show available commands",
                        "  clear      Clear terminal",
                        "  cls        Clear terminal",
                        "  pwd        Show current directory",
                        "  ls         List files",
                        "  dir        List files",
                        "  cd         Change directory",
                        "  echo       Print text",
                        "  whoami     Show current user",
                        "  date       Show current date",
                        "  version    Show ZS Code version",
                    ].join("\n")
                );
                break;

            case "clear":
            case "cls":
                setHistory([]);
                break;

            case "pwd":
                addOutput(
                    `/home/zaeem${currentPath === "~" ? "" : currentPath}`
                );
                break;

            case "ls":
            case "dir":
                addOutput(
                    [
                        "src",
                        "public",
                        "package.json",
                        "README.md",
                        "index.html",
                    ].join("\n")
                );
                break;

            case "cd":
                if (!args.length) {
                    setCurrentPath("~");
                    break;
                }

                if (args[0] === "..") {
                    setCurrentPath("~");
                    break;
                }

                if (args[0] === "src") {
                    setCurrentPath("~/src");
                    break;
                }

                if (args[0] === "public") {
                    setCurrentPath("~/public");
                    break;
                }

                addOutput(
                    `cd: no such directory: ${args[0]}`,
                    "error"
                );
                break;

            case "echo":
                addOutput(args.join(" "));
                break;

            case "whoami":
                addOutput("zaeem");
                break;

            case "date":
                addOutput(new Date().toString());
                break;

            case "version":
                addOutput("ZS Code Terminal v1.0.0");
                break;

            default:
                addOutput(
                    `${cmd}: command not found`,
                    "error"
                );
                break;
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        executeCommand(input);
        setInput("");
    };

    const handleTerminalClick = () => {
        inputRef.current?.focus();
    };

    /*
     * IMPORTANT:
     * We don't return null when closed.
     * This allows the terminal to smoothly slide DOWN
     * instead of instantly disappearing.
     */

    return (
        <div
            className={`
                fixed
                left-72
                right-0
                bottom-0
                z-[100]
                overflow-hidden
                border-t
                transition-transform
                duration-300
                ease-out

                ${
                    maximized
                        ? "top-0"
                        : "h-[42vh] min-h-[300px] max-h-[520px]"
                }

                ${
                    isOpen
                        ? "translate-y-0"
                        : "translate-y-full"
                }

                ${
                    isDark
                        ? "border-white/10 bg-[#181818]"
                        : "border-black/10 bg-white"
                }
            `}
        >
            {/* =========================================
                TERMINAL HEADER
            ========================================= */}

            <div
                className={`
                    flex
                    h-10
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    px-3

                    ${
                        isDark
                            ? "border-white/10 bg-[#202020]"
                            : "border-black/10 bg-[#f5f5f5]"
                    }
                `}
            >
                {/* LEFT SIDE */}

                <div className="flex items-center gap-3">
                    {/* Mac-style dots */}

                    <div className="flex items-center gap-1.5">
                        {/* Close */}

                        <button
                            type="button"
                            onClick={onClose}
                            title="Close terminal"
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-[#ff5f57]
                                transition-transform
                                hover:scale-110
                            "
                        />

                        {/* Minimize */}

                        <button
                            type="button"
                            onClick={() => setMaximized(false)}
                            title="Minimize terminal"
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-[#febc2e]
                                transition-transform
                                hover:scale-110
                            "
                        />

                        {/* Maximize */}

                        <button
                            type="button"
                            onClick={() =>
                                setMaximized((prev) => !prev)
                            }
                            title={
                                maximized
                                    ? "Restore terminal"
                                    : "Maximize terminal"
                            }
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-[#28c840]
                                transition-transform
                                hover:scale-110
                            "
                        />
                    </div>

                    {/* Terminal title */}

                    <div
                        className={`
                            ml-2
                            flex
                            items-center
                            gap-2
                            font-plex
                            text-sm

                            ${
                                isDark
                                    ? "text-white/70"
                                    : "text-slate-600"
                            }
                        `}
                    >
                        <FaTerminal className="text-[12px]" />

                        <span>Terminal</span>
                    </div>
                </div>

                {/* RIGHT SIDE */}

                <div className="flex items-center gap-1">
                    {/* Maximize */}

                    <button
                        type="button"
                        onClick={() =>
                            setMaximized((prev) => !prev)
                        }
                        title={
                            maximized
                                ? "Restore"
                                : "Maximize"
                        }
                        className={`
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            transition-colors

                            ${
                                isDark
                                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                                    : "text-slate-500 hover:bg-black/5 hover:text-slate-800"
                            }
                        `}
                    >
                        <FaExpandAlt className="text-[11px]" />
                    </button>

                    {/* Close */}

                    <button
                        type="button"
                        onClick={onClose}
                        title="Close terminal"
                        className={`
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            transition-colors

                            ${
                                isDark
                                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                                    : "text-slate-500 hover:bg-black/5 hover:text-slate-800"
                            }
                        `}
                    >
                        <FaTimes className="text-[13px]" />
                    </button>
                </div>
            </div>

            {/* =========================================
                TERMINAL BODY
            ========================================= */}

            <div
                ref={terminalBodyRef}
                onClick={handleTerminalClick}
                className={`
                    h-[calc(100%-40px)]
                    overflow-y-auto
                    p-4
                    font-mono
                    text-[13px]
                    leading-6

                    ${
                        isDark
                            ? "bg-[#181818] text-white/80"
                            : "bg-[#fafafa] text-slate-800"
                    }
                `}
                style={{
                    scrollbarWidth: "thin",
                }}
            >
                {/* =====================================
                    TERMINAL OUTPUT
                ===================================== */}

                {history.map((item, index) => {
                    {/* Command */}

                    if (item.type === "command") {
                        return (
                            <div
                                key={index}
                                className="flex flex-wrap"
                            >
                                <span className="mr-2 text-[#7C3AED]">
                                    {item.path}
                                </span>

                                <span className="mr-2 text-[#22c55e]">
                                    $
                                </span>

                                <span
                                    className={
                                        isDark
                                            ? "text-white"
                                            : "text-slate-900"
                                    }
                                >
                                    {item.text}
                                </span>
                            </div>
                        );
                    }

                    {/* Error */}

                    if (item.type === "error") {
                        return (
                            <pre
                                key={index}
                                className="
                                    whitespace-pre-wrap
                                    text-red-400
                                "
                            >
                                {item.text}
                            </pre>
                        );
                    }

                    {/* System */}

                    if (item.type === "system") {
                        return (
                            <pre
                                key={index}
                                className="
                                    whitespace-pre-wrap
                                    text-blue-400
                                "
                            >
                                {item.text}
                            </pre>
                        );
                    }

                    {/* Normal output */}

                    return (
                        <pre
                            key={index}
                            className={`
                                whitespace-pre-wrap

                                ${
                                    isDark
                                        ? "text-white/70"
                                        : "text-slate-600"
                                }
                            `}
                        >
                            {item.text}
                        </pre>
                    );
                })}

                {/* =====================================
                    INPUT
                ===================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="flex items-start"
                >
                    <span className="mr-2 text-[#7C3AED]">
                        {currentPath}
                    </span>

                    <span className="mr-2 text-[#22c55e]">
                        $
                    </span>

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(event) =>
                            setInput(event.target.value)
                        }
                        autoComplete="off"
                        spellCheck="false"
                        className={`
                            min-w-0
                            flex-1
                            bg-transparent
                            outline-none

                            ${
                                isDark
                                    ? "text-white"
                                    : "text-slate-900"
                            }
                        `}
                    />
                </form>
            </div>
        </div>
    );
};

export default Terminal;