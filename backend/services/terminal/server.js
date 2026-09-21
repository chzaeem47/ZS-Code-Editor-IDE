import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import fs from "fs/promises";
import pty from "node-pty";
import { Server } from "socket.io";
import { ensureWorkspace, getWorkspaceRoot } from "./services/workspace.service.js";
import {
    startFilesystemWatcher,
    stopFilesystemWatcher,
    stopAllFilesystemWatchers
} from "./services/filesystem-sync.service.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;
const fileServiceUrl = (process.env.FILE_SERVICE_URL || "http://localhost:3003").replace(/\/$/, "");
const authServiceUrl = (process.env.AUTH_SERVICE_URL || process.env.AUTH_SERVICE || "http://localhost:3001").replace(/\/$/, "");
const SHELL = process.platform === "win32" ? "powershell.exe" : "bash";
const SOCKET_PROTOCOL_VERSION = "1.0";

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
    }
});

const terminalSessions = new Map();

const send = (socket, data) => {
    if (socket.connected) socket.emit("terminal:data", String(data ?? ""));
};

const isValidProjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

const safeName = (name) => {
    const value = String(name || "").trim();
    if (!value || value === "." || value === ".." || /[\\/]/.test(value)) {
        throw new Error(`Invalid file/folder name: ${value}`);
    }
    return value;
};

const normalizeCols = (cols) => {
    const value = Number(cols);
    if (!Number.isFinite(value)) return 80;
    return Math.max(20, Math.min(Math.floor(value), 500));
};

const normalizeRows = (rows) => {
    const value = Number(rows);
    if (!Number.isFinite(value)) return 30;
    return Math.max(3, Math.min(Math.floor(value), 200));
};

const getAuthenticatedUser = async (socket) => {
    const cookie = socket.handshake.headers.cookie;

    if (!cookie) {
        throw new Error("Authentication required");
    }

    const response = await fetch(`${authServiceUrl}/me`, {
        headers: {
            cookie,
            "x-user-id": String(socket.handshake.auth?.userId || "")
        }
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Invalid authentication response");
    }

    if (!response.ok) {
        throw new Error(data?.message || "Unauthorized");
    }

    const user = data?.user || data?.data?.user || data?.data || data;
    const userId = user?._id || user?.id || socket.handshake.auth?.userId;

    if (!userId) {
        throw new Error("Authenticated user ID not found");
    }

    return String(userId);
};

const getTree = async ({ projectId, userId }) => {
    const response = await fetch(`${fileServiceUrl}/tree/${projectId}`, {
        headers: { "x-user-id": String(userId) }
    });

    const text = await response.text();
    let data = [];
    try {
        data = text ? JSON.parse(text) : [];
    } catch {
        throw new Error(`Invalid File Service response: ${text}`);
    }

    if (!response.ok) {
        throw new Error(data?.message || `File Service returned ${response.status}`);
    }

    return Array.isArray(data) ? data : [];
};

const writeNodes = async (nodes, directory) => {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
        const name = safeName(node.name);
        const target = path.join(directory, name);

        if (node.type === "folder") {
            await fs.mkdir(target, { recursive: true });
            await writeNodes(node.children || [], target);
            continue;
        }

        if (node.type === "file") {
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, node.content || "", "utf8");
        }
    }
};

const syncProject = async (projectId, userId) => {
    const tree = await getTree({ projectId, userId });

    if (!tree.length) {
        throw new Error("Project not found or access denied");
    }

    const root = await ensureWorkspace(projectId);

    if (tree.length === 1 && tree[0]?.type === "folder") {
        await writeNodes(tree[0].children || [], root);
    } else {
        await writeNodes(tree, root);
    }

    return { tree, root };
};

const killSession = socketId => {
    const terminalSession = terminalSessions.get(socketId);

    if (!terminalSession) return;

    try {
        terminalSession.ptyProcess.kill();
    } catch { }

    terminalSessions.delete(socketId);
};

io.use(async (socket, next) => {
    try {
        const version = socket.handshake.auth?.protocolVersion;

        if (version !== SOCKET_PROTOCOL_VERSION) {
            return next(new Error("Unsupported socket protocol version"));
        }

        const userId = await getAuthenticatedUser(socket);
        socket.data.userId = userId;
        next();
    } catch (error) {
        console.error(`Socket authentication failed: ${error.message}`);
        next(new Error(error.message || "Unauthorized"));
    }
});

io.on("connection", (socket) => {
    console.log(`Terminal Connected: ${socket.id} | User: ${socket.data.userId}`);

    socket.on("terminal:init", async (data = {}, ack) => {
        try {
            const projectId = String(data.projectId || "");
            const userId = socket.data.userId;

            if (!projectId || !userId) {
                throw new Error(
                    "Project ID and authenticated user are required"
                );
            }

            if (!isValidProjectId(projectId)) {
                throw new Error("Invalid project ID");
            }

            const cols = normalizeCols(data.cols);
            const rows = normalizeRows(data.rows);

            const existingSession = terminalSessions.get(socket.id);

            if (existingSession) {
                await stopFilesystemWatcher(
                    existingSession.projectId,
                    socket.id
                );

                killSession(socket.id);
            }

            const { root } = await syncProject(
                projectId,
                userId
            );

            await startFilesystemWatcher({
                projectId,
                userId,
                root,
                fileServiceUrl,
                clientId: socket.id
            });

            const ptyProcess = pty.spawn(
                SHELL,
                ["-NoLogo", "-NoProfile", "-NoExit"],
                {
                    name: "xterm-256color",
                    cols,
                    rows,
                    cwd: root,
                    env: {
                        ...process.env,
                        FORCE_COLOR: "1"
                    }
                }
            );

            ptyProcess.onData(data => {
                send(socket, data);
            });

            ptyProcess.onExit(
                ({ exitCode }) => {
                    send(
                        socket,
                        `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`
                    );

                    const session =
                        terminalSessions.get(socket.id);

                    if (session?.ptyProcess === ptyProcess) {
                        terminalSessions.delete(socket.id);

                        stopFilesystemWatcher(
                            session.projectId,
                            socket.id
                        ).catch(error => {
                            console.error(
                                `Watcher cleanup failed for ${session.projectId}:`,
                                error.message
                            );
                        });
                    }
                }
            );

            terminalSessions.set(socket.id, {
                projectId,
                userId,
                cwd: root,
                ptyProcess
            });

            socket.emit("terminal:ready", {
                protocolVersion: SOCKET_PROTOCOL_VERSION,
                cols,
                rows,
                cwd: root
            });

            ack?.({
                success: true,
                projectId,
                cwd: root
            });

            console.log(
                `Terminal Ready: ${socket.id} → ${root}`
            );
        } catch (error) {
            console.error(
                "terminal:init error:",
                error
            );

            send(
                socket,
                `\r\n\x1b[31m${error.message}\x1b[0m\r\n`
            );

            socket.emit("terminal:error", {
                code: "TERMINAL_ERROR",
                message: error.message
            });

            ack?.({
                success: false,
                code: "TERMINAL_INIT_FAILED",
                message: error.message
            });
        }
    });

    socket.on("terminal:write", (data) => {
        const terminalSession = terminalSessions.get(socket.id);
        if (!terminalSession?.ptyProcess) return;

        try {
            terminalSession.ptyProcess.write(String(data ?? ""));
        } catch (error) {
            send(socket, `\r\n\x1b[31m${error.message}\x1b[0m\r\n`);
        }
    });

    socket.on("terminal:resize", (data = {}) => {
        const terminalSession = terminalSessions.get(socket.id);
        if (!terminalSession?.ptyProcess) return;

        try {
            terminalSession.ptyProcess.resize(
                normalizeCols(data.cols),
                normalizeRows(data.rows)
            );
        } catch (error) {
            send(socket, `\r\n\x1b[31mResize error: ${error.message}\x1b[0m\r\n`);
        }
    });

    socket.on("terminal:restart", async () => {
        const session = terminalSessions.get(socket.id);

        if (!session) return;

        killSession(socket.id);

        await stopFilesystemWatcher(
            session.projectId,
            socket.id
        );

        socket.emit("terminal:restart");
    });

    socket.on("disconnect", reason => {
        console.log(
            `Terminal Disconnected: ${socket.id} | ${reason}`
        );

        const session = terminalSessions.get(socket.id);

        killSession(socket.id);

        if (session?.projectId) {
            stopFilesystemWatcher(
                session.projectId,
                socket.id
            ).catch(error => {
                console.error(
                    `Watcher cleanup failed for ${session.projectId}:`,
                    error.message
                );
            });
        }
    });
});

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "Terminal",
        activeSessions: terminalSessions.size
    });
});

const startServer = async () => {
    try {
        await fs.mkdir(getWorkspaceRoot(), { recursive: true });

        server.listen(port, () => {
            console.log(`Terminal Service is running on Port ${port}`);
            console.log(`Workspace Root: ${getWorkspaceRoot()}`);
            console.log(`Shell: ${SHELL}`);
            console.log(`Auth Service: ${authServiceUrl}`);
        });
    } catch (error) {
        console.error("Terminal Service startup failed:", error);
        process.exit(1);
    }
};

const shutdown = async () => {
    for (const socketId of terminalSessions.keys()) {
        killSession(socketId);
    }

    await stopAllFilesystemWatchers();

    server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();