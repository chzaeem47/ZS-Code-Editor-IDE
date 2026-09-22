import { spawn } from "child_process";

const processes = new Map();

const getCommand = (command, args = []) => {
    if (Array.isArray(args) && args.length) return `${command} ${args.join(" ")}`;
    return command;
};

export const startProcess = async ({
    processId,
    projectId,
    command,
    args = [],
    cwd,
    env = {},
    onData,
    onExit
}) => {
    if (!processId) throw new Error("Process ID is required");
    if (!projectId) throw new Error("Project ID is required");
    if (!command) throw new Error("Command is required");
    if (processes.has(processId)) throw new Error("Process already exists");

    const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        shell: process.platform === "win32",
        windowsHide: true
    });

    const record = {
        processId,
        projectId,
        command: getCommand(command, args),
        pid: child.pid,
        status: "running",
        child,
        cwd,
        env,
        onData,
        onExit,
        startedAt: Date.now()
    };

    processes.set(processId, record);

    child.stdout?.on("data", data => {
        onData?.(String(data));
    });

    child.stderr?.on("data", data => {
        onData?.(String(data));
    });

    child.on("error", error => {
        record.status = "error";
        onData?.(`\r\n[Process Error] ${error.message}\r\n`);
    });

    child.on("exit", (code, signal) => {
        record.status = "stopped";
        record.exitCode = code;
        record.signal = signal;
        record.endedAt = Date.now();

        onExit?.({
            processId,
            projectId,
            code,
            signal
        });
    });

    return getProcess(processId);
};

export const stopProcess = async processId => {
    const record = processes.get(processId);

    if (!record) return false;

    try {
        record.child.kill();
    } catch { }

    record.status = "stopped";

    return true;
};

export const restartProcess = async processId => {
    const record = processes.get(processId);

    if (!record) throw new Error("Process not found");

    const config = {
        processId,
        projectId: record.projectId,
        command: record.command,
        cwd: record.cwd,
        env: record.env,
        onData: record.onData,
        onExit: record.onExit
    };

    await stopProcess(processId);
    processes.delete(processId);

    return startProcess(config);
};

export const getProcess = processId => {
    const record = processes.get(processId);

    if (!record) return null;

    return {
        processId: record.processId,
        projectId: record.projectId,
        command: record.command,
        pid: record.pid,
        status: record.status,
        startedAt: record.startedAt,
        exitCode: record.exitCode,
        signal: record.signal,
        endedAt: record.endedAt
    };
};

export const getProjectProcesses = projectId => {
    return [...processes.values()]
        .filter(process => process.projectId === projectId)
        .map(process => ({
            processId: process.processId,
            projectId: process.projectId,
            command: process.command,
            pid: process.pid,
            status: process.status,
            startedAt: process.startedAt,
            exitCode: process.exitCode,
            signal: process.signal,
            endedAt: process.endedAt
        }));
};

export const stopProjectProcesses = async projectId => {
    const projectProcesses = [...processes.values()]
        .filter(process => process.projectId === projectId);

    await Promise.all(
        projectProcesses.map(process => stopProcess(process.processId))
    );
};