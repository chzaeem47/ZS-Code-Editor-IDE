import { spawn, execFile } from "child_process";

const processes = new Map();

const MAX_PROCESSES_PER_PROJECT = 10;

const normalizeCommand = command => {
    const value = String(command || "").trim();

    if (!value) {
        throw new Error("Process command is required");
    }

    if (process.platform === "win32") {
        const windowsCommands = new Set([
            "npm",
            "npx",
            "pnpm",
            "yarn"
        ]);

        if (windowsCommands.has(value.toLowerCase())) {
            return `${value}.cmd`;
        }
    }

    return value;
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
    finishedAt: processInfo.finishedAt || null,
    exitCode: processInfo.exitCode ?? null,
    signal: processInfo.signal || null
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
    onExit
}) => {
    if (!processId) {
        throw new Error("Process ID is required");
    }

    if (!projectId) {
        throw new Error("Project ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }

    if (!cwd) {
        throw new Error("Working directory is required");
    }

    const projectProcesses = [...processes.values()].filter(
        item =>
            item.projectId === String(projectId) &&
            item.userId === String(userId) &&
            ["starting", "running"].includes(item.status)
    );

    if (projectProcesses.length >= MAX_PROCESSES_PER_PROJECT) {
        throw new Error(
            `Maximum ${MAX_PROCESSES_PER_PROJECT} processes allowed per project`
        );
    }

    const executable = normalizeCommand(command);

    const normalizedArgs = Array.isArray(args)
        ? args.map(value => String(value))
        : [];

    const child = spawn(
        executable,
        normalizedArgs,
        {
            cwd,
            env: {
                ...process.env,
                FORCE_COLOR: "1"
            },
            shell: false,
            windowsHide: true,
            detached: process.platform !== "win32"
        }
    );

    const processInfo = {
        processId: String(processId),
        projectId: String(projectId),
        userId: String(userId),
        socketId: String(socketId || ""),
        pid: child.pid,
        command: executable,
        args: normalizedArgs,
        cwd,
        status: "starting",
        startedAt: Date.now(),
        finishedAt: null,
        exitCode: null,
        signal: null,
        child
    };

    processes.set(
        processInfo.processId,
        processInfo
    );

    child.stdout?.on("data", data => {
        if (processInfo.status === "starting") {
            processInfo.status = "running";
        }

        onData?.(data.toString());
    });

    child.stderr?.on("data", data => {
        if (processInfo.status === "starting") {
            processInfo.status = "running";
        }

        onData?.(data.toString());
    });

    child.on("error", error => {
        processInfo.status = "failed";
        processInfo.finishedAt = Date.now();

        onData?.(
            `\r\n\x1b[31m[Process Error] ${error.message}\x1b[0m\r\n`
        );
    });

    child.on("spawn", () => {
        processInfo.status = "running";
    });

    child.on("exit", (exitCode, signal) => {
        processInfo.status =
            signal || processInfo.status === "stopping"
                ? "stopped"
                : "exited";

        processInfo.finishedAt = Date.now();
        processInfo.exitCode = exitCode;
        processInfo.signal = signal;

        onExit?.({
            ...serializeProcess(processInfo),
            exitCode,
            signal
        });
    });

    return serializeProcess(processInfo);
};

export const getProcess = processId => {
    const processInfo = processes.get(String(processId));

    if (!processInfo) {
        return null;
    }

    return serializeProcess(processInfo);
};

export const getProjectProcesses = (
    projectId,
    userId
) => {
    return [...processes.values()]
        .filter(processInfo =>
            processInfo.projectId === String(projectId) &&
            (!userId ||
                processInfo.userId === String(userId))
        )
        .sort((a, b) =>
            b.startedAt - a.startedAt
        )
        .map(serializeProcess);
};

export const stopProcess = async (
    processId,
    userId
) => {
    const processInfo =
        processes.get(String(processId));

    if (!processInfo) {
        return false;
    }

    if (
        userId &&
        processInfo.userId !== String(userId)
    ) {
        throw new Error("Process access denied");
    }

    if (
        ["exited", "stopped", "failed"].includes(
            processInfo.status
        )
    ) {
        return true;
    }

    processInfo.status = "stopping";

    const pid = processInfo.pid;

    if (!pid) {
        return false;
    }

    await new Promise(resolve => {
        if (process.platform === "win32") {
            execFile(
                "taskkill",
                ["/PID", String(pid), "/T", "/F"],
                () => resolve()
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
    });

    return true;
};

export const stopProjectProcesses = async (
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
            .filter(item =>
                ["starting", "running"].includes(
                    item.status
                )
            )
            .map(item =>
                stopProcess(
                    item.processId,
                    userId
                )
            )
    );

    return true;
};

export const stopSocketProcesses = async socketId => {
    const socketProcesses =
        [...processes.values()].filter(
            item =>
                item.socketId === String(socketId) &&
                ["starting", "running"].includes(
                    item.status
                )
        );

    await Promise.all(
        socketProcesses.map(item =>
            stopProcess(
                item.processId,
                item.userId
            )
        )
    );

    return true;
};

export const cleanupFinishedProcesses = (
    maxAge = 1000 * 60 * 30
) => {
    const now = Date.now();

    for (const [
        processId,
        processInfo
    ] of processes) {
        if (
            processInfo.finishedAt &&
            now - processInfo.finishedAt > maxAge
        ) {
            processes.delete(processId);
        }
    }
};