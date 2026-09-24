import { spawn, execFile } from "child_process";

const processes = new Map();

const MAX_PROCESSES_PER_PROJECT = 10;

const PORT_REGEXES = [
    /Local:\s*https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):(\d{1,5})/gi,
    /(?:localhost|127\.0\.0\.1|\[::1\]):(\d{1,5})/gi,
    /\b(?:port|running on|listening on)\s*[:=]?\s*(\d{1,5})\b/gi
];

const normalizePort = value => {
    const port = Number(value);

    if (!Number.isInteger(port)) {
        return null;
    }

    if (port < 1 || port > 65535) {
        return null;
    }

    return port;
};

const RESERVED_PORT = normalizePort(
    process.env.ZS_CODE_FRONTEND_PORT || 5173
);

const detectPort = output => {
    const text = String(output || "");

    for (const regex of PORT_REGEXES) {
        regex.lastIndex = 0;

        let match;

        while ((match = regex.exec(text))) {
            const port = normalizePort(match[1]);

            if (
                port &&
                port !== RESERVED_PORT
            ) {
                return port;
            }
        }
    }

    return null;
};

const normalizeCommand = command => {
    const value = String(
        command || ""
    ).trim();

    if (!value) {
        throw new Error(
            "Process command is required"
        );
    }

    return value;
};

const quoteWindowsArg = value => {
    const stringValue = String(
        value ?? ""
    );

    if (
        !/[\s"&|<>^]/.test(
            stringValue
        )
    ) {
        return stringValue;
    }

    return `"${stringValue.replace(
        /"/g,
        '\\"'
    )}"`;
};

const buildSpawnConfig = ({
    command,
    args,
    cwd
}) => {
    if (process.platform !== "win32") {
        return {
            executable: command,
            spawnArgs: args,
            options: {
                cwd,
                env: {
                    ...process.env,
                    FORCE_COLOR: "1"
                },
                shell: false,
                windowsHide: true,
                detached: false
            }
        };
    }

    const comSpec =
        process.env.ComSpec ||
        process.env.COMSPEC ||
        "C:\\Windows\\System32\\cmd.exe";

    const commandLine = [
        command,
        ...args
    ]
        .map(quoteWindowsArg)
        .join(" ");

    return {
        executable: comSpec,
        spawnArgs: [
            "/d",
            "/s",
            "/c",
            commandLine
        ],
        options: {
            cwd,
            env: {
                ...process.env,
                FORCE_COLOR: "1"
            },
            shell: false,
            windowsHide: true,
            detached: false
        }
    };
};

const serializeProcess = processInfo => ({
    processId: processInfo.processId,
    projectId: processInfo.projectId,
    userId: processInfo.userId,
    socketId: processInfo.socketId,
    pid: processInfo.pid,
    command: processInfo.command,
    args: processInfo.args,
    cwd: processInfo.cwd,
    status: processInfo.status,
    startedAt: processInfo.startedAt,
    finishedAt:
        processInfo.finishedAt || null,
    exitCode:
        processInfo.exitCode ?? null,
    signal:
        processInfo.signal || null,
    port:
        processInfo.port || null,
    previewUrl:
        processInfo.previewUrl || null
});

export const startProcess = async ({
    processId,
    projectId,
    userId,
    socketId,
    command,
    args = [],
    cwd,
    onData,
    onPort,
    onExit
}) => {
    if (!processId) {
        throw new Error(
            "Process ID is required"
        );
    }

    if (!projectId) {
        throw new Error(
            "Project ID is required"
        );
    }

    if (!userId) {
        throw new Error(
            "User ID is required"
        );
    }

    if (!cwd) {
        throw new Error(
            "Working directory is required"
        );
    }

    const activeProjectProcesses =
        [
            ...processes.values()
        ].filter(
            item =>
                item.projectId ===
                    String(projectId) &&
                item.userId ===
                    String(userId) &&
                [
                    "starting",
                    "running"
                ].includes(
                    item.status
                )
        );

    if (
        activeProjectProcesses.length >=
        MAX_PROCESSES_PER_PROJECT
    ) {
        throw new Error(
            `Maximum ${MAX_PROCESSES_PER_PROJECT} processes allowed per project`
        );
    }

    const normalizedCommand =
        normalizeCommand(
            command
        );

    const normalizedArgs =
        Array.isArray(args)
            ? args.map(value =>
                String(value)
            )
            : [];

    const {
        executable,
        spawnArgs,
        options
    } = buildSpawnConfig({
        command:
            process.platform ===
            "win32"
                ? normalizedCommand
                : normalizedCommand,
        args:
            normalizedArgs,
        cwd
    });

    console.log(
        `[Process] Starting: ${normalizedCommand} ${normalizedArgs.join(" ")}`
    );

    console.log(
        `[Process] CWD: ${cwd}`
    );

    const child = spawn(
        executable,
        spawnArgs,
        options
    );

    const processInfo = {
        processId:
            String(processId),
        projectId:
            String(projectId),
        userId:
            String(userId),
        socketId:
            String(socketId || ""),
        pid:
            child.pid || null,
        command:
            normalizedCommand,
        args:
            normalizedArgs,
        cwd,
        status:
            "starting",
        startedAt:
            Date.now(),
        finishedAt:
            null,
        exitCode:
            null,
        signal:
            null,
        port:
            null,
        previewUrl:
            null,
        outputBuffer:
            "",
        child
    };

    processes.set(
        processInfo.processId,
        processInfo
    );

    const handleOutput =
        data => {
            const output =
                data.toString();

            if (
                processInfo.status ===
                "starting"
            ) {
                processInfo.status =
                    "running";
            }

            processInfo.outputBuffer =
                (
                    processInfo.outputBuffer +
                    output
                ).slice(-8192);

            const detectedPort =
                detectPort(
                    processInfo.outputBuffer
                );

            if (
                detectedPort &&
                detectedPort !==
                    processInfo.port
            ) {
                processInfo.port =
                    detectedPort;

                processInfo.previewUrl =
                    `http://localhost:${detectedPort}`;

                console.log(
                    `[Process] Port detected: ${processInfo.projectId} → ${detectedPort}`
                );

                onPort?.({
                    ...serializeProcess(
                        processInfo
                    ),
                    port:
                        detectedPort,
                    previewUrl:
                        processInfo.previewUrl
                });
            }

            onData?.(
                output
            );
        };

    child.stdout?.on(
        "data",
        handleOutput
    );

    child.stderr?.on(
        "data",
        handleOutput
    );

    child.on(
        "spawn",
        () => {
            processInfo.status =
                "running";

            console.log(
                `[Process] Started PID ${child.pid}: ${normalizedCommand}`
            );
        }
    );

    child.on(
        "error",
        error => {
            processInfo.status =
                "failed";

            processInfo.finishedAt =
                Date.now();

            console.error(
                `[Process] Error PID ${processInfo.pid}:`,
                error
            );

            onData?.(
                `\r\n\x1b[31m[Process Error] ${error.message}\x1b[0m\r\n`
            );
        }
    );

    child.on(
        "exit",
        (
            exitCode,
            signal
        ) => {
            processInfo.status =
                signal ||
                processInfo.status ===
                    "stopping"
                    ? "stopped"
                    : "exited";

            processInfo.finishedAt =
                Date.now();

            processInfo.exitCode =
                exitCode;

            processInfo.signal =
                signal;

            console.log(
                `[Process] Exit PID ${processInfo.pid} | code=${exitCode} signal=${signal}`
            );

            onExit?.(
                serializeProcess(
                    processInfo
                )
            );
        }
    );

    return serializeProcess(
        processInfo
    );
};

export const getProcess =
    processId => {
        const processInfo =
            processes.get(
                String(processId)
            );

        if (!processInfo) {
            return null;
        }

        return serializeProcess(
            processInfo
        );
    };

export const getProjectProcesses =
    (
        projectId,
        userId
    ) => {
        return [
            ...processes.values()
        ]
            .filter(
                processInfo =>
                    processInfo.projectId ===
                        String(
                            projectId
                        ) &&
                    (
                        !userId ||
                        processInfo.userId ===
                            String(
                                userId
                            )
                    )
            )
            .sort(
                (a,b) =>
                    b.startedAt -
                    a.startedAt
            )
            .map(
                serializeProcess
            );
    };

export const stopProcess =
    async (
        processId,
        userId
    ) => {
        const processInfo =
            processes.get(
                String(processId)
            );

        if (!processInfo) {
            return false;
        }

        if (
            userId &&
            processInfo.userId !==
                String(userId)
        ) {
            throw new Error(
                "Process access denied"
            );
        }

        if (
            [
                "exited",
                "stopped",
                "failed"
            ].includes(
                processInfo.status
            )
        ) {
            return true;
        }

        processInfo.status =
            "stopping";

        const pid =
            processInfo.pid;

        if (!pid) {
            return false;
        }

        await new Promise(
            resolve => {
                if (
                    process.platform ===
                    "win32"
                ) {
                    execFile(
                        "taskkill",
                        [
                            "/PID",
                            String(pid),
                            "/T",
                            "/F"
                        ],
                        error => {
                            if (
                                error
                            ) {
                                console.error(
                                    `[Process] taskkill failed for PID ${pid}:`,
                                    error.message
                                );
                            }

                            resolve();
                        }
                    );

                    return;
                }

                try {
                    process.kill(
                        -pid,
                        "SIGTERM"
                    );
                } catch {
                    try {
                        process.kill(
                            pid,
                            "SIGTERM"
                        );
                    } catch {}
                }

                resolve();
            }
        );

        return true;
    };

export const stopProjectProcesses =
    async (
        projectId,
        userId
    ) => {
        const projectProcesses =
            getProjectProcesses(
                projectId,
                userId
            );

        await Promise.all(
            projectProcesses
                .filter(
                    item =>
                        [
                            "starting",
                            "running"
                        ].includes(
                            item.status
                        )
                )
                .map(
                    item =>
                        stopProcess(
                            item.processId,
                            userId
                        )
                )
        );

        return true;
    };

export const stopSocketProcesses =
    async socketId => {
        const socketProcesses =
            [
                ...processes.values()
            ].filter(
                item =>
                    item.socketId ===
                        String(
                            socketId
                        ) &&
                    [
                        "starting",
                        "running"
                    ].includes(
                        item.status
                    )
            );

        await Promise.all(
            socketProcesses.map(
                item =>
                    stopProcess(
                        item.processId,
                        item.userId
                    )
            )
        );

        return true;
    };

export const stopAllProcesses =
    async () => {
        const activeProcesses =
            [
                ...processes.values()
            ].filter(
                item =>
                    [
                        "starting",
                        "running"
                    ].includes(
                        item.status
                    )
            );

        await Promise.all(
            activeProcesses.map(
                item =>
                    stopProcess(
                        item.processId
                    )
            )
        );

        return true;
    };

export const cleanupFinishedProcesses =
    (
        maxAge =
            1000 * 60 * 30
    ) => {
        const now =
            Date.now();

        for (
            const [
                processId,
                processInfo
            ] of processes
        ) {
            if (
                processInfo.finishedAt &&
                now -
                    processInfo.finishedAt >
                    maxAge
            ) {
                processes.delete(
                    processId
                );
            }
        }
    };