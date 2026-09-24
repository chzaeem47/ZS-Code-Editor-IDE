import { useEffect, useState } from "react";
import {
    FaPlay,
    FaStop,
    FaSyncAlt,
    FaExternalLinkAlt
} from "react-icons/fa";

const ProcessManager = ({
    socket,
    projectId,
    isDark
}) => {
    const [processes, setProcesses] = useState([]);
    const [command, setCommand] = useState("");
    const [args, setArgs] = useState("");
    const [loading, setLoading] = useState(false);

    const loadProcesses = () => {
        if (
            !socket?.connected ||
            !projectId
        ) {
            return;
        }

        socket.emit(
            "process:list",
            { projectId }
        );
    };

    const openPreview = (
        port,
        previewUrl
    ) => {
        if (!port) return;

        const url =
            previewUrl ||
            `http://localhost:${port}`;

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

        window.dispatchEvent(
            new CustomEvent(
                "zs-code-process-preview",
                {
                    detail: {
                        projectId,
                        port,
                        url
                    }
                }
            )
        );
    };

    useEffect(() => {
        if (
            !socket ||
            !projectId
        ) {
            return;
        }

        const handleList = payload => {
            if (
                String(
                    payload?.projectId
                ) !== String(projectId)
            ) {
                return;
            }

            setProcesses(
                Array.isArray(
                    payload?.processes
                )
                    ? payload.processes
                    : []
            );
        };

        const handleStarted =
            processInfo => {
                if (
                    String(
                        processInfo?.projectId
                    ) !== String(projectId)
                ) {
                    return;
                }

                setProcesses(
                    previous => {
                        const exists =
                            previous.some(
                                item =>
                                    item.processId ===
                                    processInfo.processId
                            );

                        return exists
                            ? previous.map(
                                item =>
                                    item.processId ===
                                        processInfo.processId
                                        ? processInfo
                                        : item
                            )
                            : [
                                processInfo,
                                ...previous
                            ];
                    }
                );
            };

        const handlePortDetected =
            payload => {
                if (
                    String(
                        payload?.projectId
                    ) !== String(projectId)
                ) {
                    return;
                }

                setProcesses(
                    previous =>
                        previous.map(
                            item =>
                                item.processId ===
                                    payload.processId
                                    ? {
                                        ...item,
                                        port:
                                            payload.port,
                                        previewUrl:
                                            payload.previewUrl
                                    }
                                    : item
                        )
                );

                window.dispatchEvent(
                    new CustomEvent(
                        "zs-code-port-detected",
                        {
                            detail: {
                                ...payload
                            }
                        }
                    )
                );
            };

        const handleExit = result => {
            setProcesses(
                previous =>
                    previous.map(
                        item =>
                            item.processId ===
                                result.processId
                                ? {
                                    ...item,
                                    ...result
                                }
                                : item
                    )
            );
        };

        socket.on(
            "process:list",
            handleList
        );

        socket.on(
            "process:started",
            handleStarted
        );

        socket.on(
            "process:port-detected",
            handlePortDetected
        );

        socket.on(
            "process:exit",
            handleExit
        );

        if (socket.connected) {
            loadProcesses();
        }

        return () => {
            socket.off(
                "process:list",
                handleList
            );

            socket.off(
                "process:started",
                handleStarted
            );

            socket.off(
                "process:port-detected",
                handlePortDetected
            );

            socket.off(
                "process:exit",
                handleExit
            );
        };
    }, [
        socket,
        projectId
    ]);

    const handleStart = () => {
        const value =
            command.trim();

        if (
            !value ||
            !socket?.connected ||
            !projectId
        ) {
            return;
        }

        setLoading(true);

        const parts =
            args.trim()
                ? args
                    .trim()
                    .split(/\s+/)
                : [];

        socket.emit(
            "process:start",
            {
                projectId,
                command: value,
                args: parts
            },
            response => {
                setLoading(false);

                if (!response?.success) {
                    console.error(
                        "Process start failed:",
                        response?.message
                    );

                    return;
                }

                setCommand("");
                setArgs("");
                loadProcesses();
            }
        );
    };

    const handleStop =
        processId => {
            if (
                !socket?.connected ||
                !processId
            ) {
                return;
            }

            socket.emit(
                "process:stop",
                { processId },
                response => {
                    if (
                        response?.success
                    ) {
                        loadProcesses();
                    }
                }
            );
        };

    return (
        <div
            className={`absolute bottom-3 right-3 z-50 w-[390px] overflow-hidden rounded-xl border shadow-2xl ${isDark
                    ? "border-white/10 bg-[#181818]"
                    : "border-black/10 bg-white"
                }`}
        >
            <div className="flex items-center justify-between px-3 py-2">
                <span
                    className={`font-plex text-xs ${isDark
                            ? "text-white/70"
                            : "text-slate-600"
                        }`}
                >
                    Processes
                </span>

                <button
                    type="button"
                    onClick={loadProcesses}
                    className={`rounded-md p-1 ${isDark
                            ? "text-white/40 hover:bg-white/5 hover:text-white/80"
                            : "text-slate-400 hover:bg-black/5 hover:text-slate-700"
                        }`}
                    title="Refresh"
                >
                    <FaSyncAlt className="text-[10px]" />
                </button>
            </div>

            <div
                className={`flex gap-2 border-y p-2 ${isDark
                        ? "border-white/10"
                        : "border-black/10"
                    }`}
            >
                <input
                    value={command}
                    onChange={e =>
                        setCommand(
                            e.target.value
                        )
                    }
                    onKeyDown={e => {
                        if (
                            e.key === "Enter"
                        ) {
                            handleStart();
                        }
                    }}
                    placeholder="npm"
                    className={`min-w-0 flex-1 rounded-md px-2 py-1 text-[11px] outline-none ${isDark
                            ? "bg-[#101010] text-white placeholder:text-white/20"
                            : "bg-slate-100 text-slate-800 placeholder:text-slate-400"
                        }`}
                />

                <input
                    value={args}
                    onChange={e =>
                        setArgs(
                            e.target.value
                        )
                    }
                    onKeyDown={e => {
                        if (
                            e.key === "Enter"
                        ) {
                            handleStart();
                        }
                    }}
                    placeholder="run dev"
                    className={`min-w-0 flex-[1.4] rounded-md px-2 py-1 text-[11px] outline-none ${isDark
                            ? "bg-[#101010] text-white placeholder:text-white/20"
                            : "bg-slate-100 text-slate-800 placeholder:text-slate-400"
                        }`}
                />

                <button
                    type="button"
                    disabled={loading}
                    onClick={handleStart}
                    className="rounded-md px-2 text-purple-400 transition hover:bg-purple-500/10 disabled:opacity-40"
                    title="Start process"
                >
                    <FaPlay className="text-[10px]" />
                </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
                {processes.length === 0 ? (
                    <div
                        className={`px-3 py-5 text-center font-plex text-[10px] ${isDark
                                ? "text-white/30"
                                : "text-slate-400"
                            }`}
                    >
                        No processes
                    </div>
                ) : (
                    processes.map(
                        process => (
                            <div
                                key={
                                    process.processId
                                }
                                className={`px-3 py-2 ${isDark
                                        ? "hover:bg-white/[0.03]"
                                        : "hover:bg-black/[0.03]"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div
                                            className={`truncate font-plex text-[11px] ${isDark
                                                    ? "text-white/80"
                                                    : "text-slate-700"
                                                }`}
                                        >
                                            {
                                                process.command
                                            }{" "}
                                            {
                                                process.args?.join(
                                                    " "
                                                )
                                            }
                                        </div>

                                        <div
                                            className={`flex gap-2 font-plex text-[9px] ${isDark
                                                    ? "text-white/30"
                                                    : "text-slate-400"
                                                }`}
                                        >
                                            <span>
                                                PID{" "}
                                                {
                                                    process.pid
                                                }
                                            </span>

                                            <span>
                                                {
                                                    process.status
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {[
                                        "starting",
                                        "running"
                                    ].includes(
                                        process.status
                                    ) && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleStop(
                                                        process.processId
                                                    )
                                                }
                                                className="rounded-md p-1 text-red-400 transition hover:bg-red-500/10"
                                                title="Stop process"
                                            >
                                                <FaStop className="text-[9px]" />
                                            </button>
                                        )}
                                </div>

                                {process.port && (
                                    <div className="mt-2 flex items-center justify-between rounded-md bg-purple-500/5 px-2 py-1.5">
                                        <div className="font-plex text-[10px] text-purple-400">
                                            Port{" "}
                                            {
                                                process.port
                                            }
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openPreview(
                                                    process.port,
                                                    process.previewUrl
                                                )
                                            }
                                            className="flex items-center gap-1.5 rounded-md px-2 py-1 font-plex text-[9px] text-blue-400 transition hover:bg-blue-500/10 hover:text-purple-400"
                                            title="Open Preview"
                                        >
                                            <FaExternalLinkAlt className="text-[8px]" />
                                            <span>
                                                Preview
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
};

export default ProcessManager;