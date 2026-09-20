import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import os from "os";
import fs from "fs/promises";
import pty from "node-pty";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;
const fileServiceUrl = (process.env.FILE_SERVICE_URL || "http://localhost:3003").replace(/\/$/, "");
const authServiceUrl = (process.env.AUTH_SERVICE_URL || process.env.AUTH_SERVICE || "http://localhost:3002").replace(/\/$/, "");
const WORKSPACE_ROOT = path.join(os.tmpdir(), "zs-code");
const SHELL = process.platform === "win32" ? "powershell.exe" : "bash";

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

const workspace = (projectId) => {
    if (!isValidProjectId(projectId)) throw new Error("Invalid project ID");
    return path.join(WORKSPACE_ROOT, String(projectId));
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
    if (!cookie) throw new Error("Authentication required");

    const response = await fetch(`${authServiceUrl}/me`, {
        headers: { cookie }
    });

    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Invalid authentication response");
    }

    if (!response.ok) throw new Error(data?.message || "Unauthorized");

    const user = data?.user || data?.data?.user || data?.data || data;
    const userId = user?._id || user?.id;

    if (!userId) throw new Error("Authenticated user ID not found");
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

    const root = workspace(projectId);
    await fs.mkdir(root, { recursive: true });

    if (tree.length === 1 && tree[0]?.type === "folder") {
        await writeNodes(tree[0].children || [], root);
    } else {
        await writeNodes(tree, root);
    }

    return { tree, root };
};

const killSession = (socketId) => {
    const terminalSession = terminalSessions.get(socketId);
    if (!terminalSession) return;

    try {
        terminalSession.ptyProcess.kill();
    } catch {}

    terminalSessions.delete(socketId);
};

io.use(async (socket, next) => {
    try {
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

    socket.on("terminal:init", async (data = {}) => {
        try {
            const projectId = String(data.projectId || "");
            const userId = socket.data.userId;

            if (!projectId || !userId) {
                throw new Error("Project ID and authenticated user are required");
            }

            const cols = normalizeCols(data.cols);
            const rows = normalizeRows(data.rows);
            const { root } = await syncProject(projectId, userId);

            killSession(socket.id);

            const ptyProcess = pty.spawn(SHELL, [], {
                name: "xterm-256color",
                cols,
                rows,
                cwd: root,
                env: {
                    ...process.env,
                    FORCE_COLOR: "1"
                }
            });

            ptyProcess.onData((data) => send(socket, data));

            ptyProcess.onExit(({ exitCode }) => {
                send(socket, `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`);
                const terminalSession = terminalSessions.get(socket.id);
                if (terminalSession?.ptyProcess === ptyProcess) {
                    terminalSessions.delete(socket.id);
                }
            });

            terminalSessions.set(socket.id, {
                projectId,
                userId,
                cwd: root,
                ptyProcess
            });

            socket.emit("terminal:ready", { cols, rows, cwd: root });
            console.log(`Terminal Ready: ${socket.id} → ${root}`);
        } catch (error) {
            console.error("terminal:init error:", error);
            send(socket, `\r\n\x1b[31m${error.message}\x1b[0m\r\n`);
            socket.emit("terminal:error", { message: error.message });
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

    socket.on("terminal:restart", () => {
        if (!terminalSessions.has(socket.id)) return;
        killSession(socket.id);
        socket.emit("terminal:restart");
    });

    socket.on("disconnect", (reason) => {
        console.log(`Terminal Disconnected: ${socket.id} | ${reason}`);
        killSession(socket.id);
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
        await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

        server.listen(port, () => {
            console.log(`Terminal Service is running on Port ${port}`);
            console.log(`Workspace Root: ${WORKSPACE_ROOT}`);
            console.log(`Shell: ${SHELL}`);
            console.log(`Auth Service: ${authServiceUrl}`);
        });
    } catch (error) {
        console.error("Terminal Service startup failed:", error);
        process.exit(1);
    }
};

const shutdown = () => {
    for (const socketId of terminalSessions.keys()) killSession(socketId);
    server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();