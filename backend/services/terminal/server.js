import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import pty from "node-pty";
import { Server } from "socket.io";

import {
    ensureWorkspace,
    getWorkspaceRoot
} from "./services/workspace.service.js";

import {
    startFilesystemWatcher,
    stopFilesystemWatcher,
    stopAllFilesystemWatchers
} from "./services/filesystem-sync.service.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3005);
const fileServiceUrl = (
    process.env.FILE_SERVICE_URL ||
    "http://localhost:3003"
).replace(/\/$/, "");
const authServiceUrl = (
    process.env.AUTH_SERVICE_URL ||
    process.env.AUTH_SERVICE ||
    "http://localhost:3001"
).replace(/\/$/, "");
const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

const SHELL =
    process.platform === "win32"
        ? "powershell.exe"
        : "bash";

const SHELL_ARGS =
    process.platform === "win32"
        ? ["-NoLogo", "-NoProfile", "-NoExit"]
        : [];

const SOCKET_PROTOCOL_VERSION = "1.0";
const PREVIEW_TOKEN_TTL_MS = 1000 * 60 * 60 * 6;
const BINARY_PREFIX = "__ZS_BASE64__:";

const IGNORED_WORKSPACE_ENTRIES = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo"
]);

const BINARY_EXTENSIONS = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "avif",
    "ico",
    "bmp",
    "tif",
    "tiff",
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "aac",
    "mp4",
    "webm",
    "mov",
    "avi",
    "woff",
    "woff2",
    "ttf",
    "otf",
    "eot",
    "pdf",
    "zip",
    "gz",
    "wasm"
]);

const PORT_URL_REGEX = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):(\d{1,5})/gi;
const PORT_MESSAGE_REGEX = /\b(?:port|running on|listening on|using another port)[^\d]{0,30}(\d{1,5})\b/gi;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: frontendUrl,
        credentials: true
    }
});

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin === frontendUrl) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, X-User-Id"
        );
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,OPTIONS"
        );
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json({ limit: "10mb" }));

const terminalSessions = new Map();
const previewTokens = new Map();

const send = (socket, data) => {
    if (socket.connected) {
        socket.emit("terminal:data", String(data ?? ""));
    }
};

const isValidProjectId = id =>
    /^[a-f\d]{24}$/i.test(String(id));

const safeName = name => {
    const value = String(name || "").trim();

    if (
        !value ||
        value === "." ||
        value === ".." ||
        /[\\/]/.test(value)
    ) {
        throw new Error(`Invalid file/folder name: ${value}`);
    }

    return value;
};

const safePreviewRelativePath = (root, relativePath) => {
    const resolvedRoot = path.resolve(root);
    const cleanRelative = String(relativePath || "")
        .replace(/^[\\/]+/, "")
        .replace(/[\\/]+/g, path.sep);

    const target = path.resolve(
        root,
        cleanRelative || "index.html"
    );

    if (
        target !== resolvedRoot &&
        !target.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
        throw new Error("Invalid preview path");
    }

    return target;
};

const normalizeCols = cols => {
    const value = Number(cols);
    if (!Number.isFinite(value)) return 80;
    return Math.max(20, Math.min(Math.floor(value), 500));
};

const normalizeRows = rows => {
    const value = Number(rows);
    if (!Number.isFinite(value)) return 30;
    return Math.max(3, Math.min(Math.floor(value), 200));
};

const authenticateRequest = async ({
    cookie,
    userIdHint = ""
}) => {
    if (!cookie) {
        throw new Error("Authentication required");
    }

    const response = await fetch(
        `${authServiceUrl}/me`,
        {
            headers: {
                cookie,
                "x-user-id": String(userIdHint || "")
            }
        }
    );

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Invalid authentication response");
    }

    if (!response.ok) {
        throw new Error(
            data?.message || "Unauthorized"
        );
    }

    const user =
        data?.user ||
        data?.data?.user ||
        data?.data ||
        data;

    const userId =
        user?._id ||
        user?.id ||
        userIdHint;

    if (!userId) {
        throw new Error("Authenticated user ID not found");
    }

    return String(userId);
};

const getAuthenticatedUser = async socket =>
    authenticateRequest({
        cookie: socket.handshake.headers.cookie,
        userIdHint: socket.handshake.auth?.userId
    });

const getAuthenticatedHttpUser = async req =>
    authenticateRequest({
        cookie: req.headers.cookie,
        userIdHint: req.headers["x-user-id"]
    });

const getTree = async ({ projectId, userId }) => {
    const response = await fetch(
        `${fileServiceUrl}/tree/${projectId}`,
        {
            headers: {
                "x-user-id": String(userId)
            }
        }
    );

    const text = await response.text();
    let data = [];

    try {
        data = text ? JSON.parse(text) : [];
    } catch {
        throw new Error(
            `Invalid File Service response: ${text}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `File Service returned ${response.status}`
        );
    }

    return Array.isArray(data) ? data : [];
};

const isBinaryNode = node => {
    const extension =
        path.extname(String(node?.name || ""))
            .slice(1)
            .toLowerCase();

    return BINARY_EXTENSIONS.has(extension);
};

const looksLikeBase64 = value => {
    const text = String(value || "").trim();

    return (
        text.length > 32 &&
        text.length % 4 === 0 &&
        /^[A-Za-z0-9+/\s]+=*$/.test(text)
    );
};

const decodeNodeContent = node => {
    const raw = node?.content;

    if (raw === null || raw === undefined) {
        return Buffer.from("");
    }

    if (Buffer.isBuffer(raw)) {
        return raw;
    }

    const value = String(raw);

    if (value.startsWith(BINARY_PREFIX)) {
        return Buffer.from(
            value.slice(BINARY_PREFIX.length),
            "base64"
        );
    }

    const dataUrlMatch = value.match(
        /^data:[^;]+;base64,(.+)$/s
    );

    if (dataUrlMatch) {
        return Buffer.from(
            dataUrlMatch[1],
            "base64"
        );
    }

    if (
        (node?.encoding === "base64" ||
            node?.isBinary === true) &&
        looksLikeBase64(value)
    ) {
        return Buffer.from(value, "base64");
    }

    if (isBinaryNode(node) && looksLikeBase64(value)) {
        return Buffer.from(value, "base64");
    }

    return Buffer.from(value, "utf8");
};

const syncEntry = async (node, directory) => {
    const name = safeName(node.name);
    const target = path.join(directory, name);

    if (node.type === "folder") {
        let existing = null;

        try {
            existing = await fs.stat(target);
        } catch {}

        if (existing && !existing.isDirectory()) {
            await fs.rm(target, {
                recursive: true,
                force: true
            });
        }

        await fs.mkdir(target, { recursive: true });
        await syncDirectory(
            target,
            Array.isArray(node.children)
                ? node.children
                : []
        );
        return;
    }

    if (node.type !== "file") {
        return;
    }

    let existing = null;

    try {
        existing = await fs.stat(target);
    } catch {}

    if (existing?.isDirectory()) {
        await fs.rm(target, {
            recursive: true,
            force: true
        });
    }

    await fs.mkdir(
        path.dirname(target),
        { recursive: true }
    );

    const nextContent = decodeNodeContent(node);

    try {
        const currentContent = await fs.readFile(target);

        if (
            currentContent.length === nextContent.length &&
            Buffer.compare(
                currentContent,
                nextContent
            ) === 0
        ) {
            return;
        }
    } catch {}

    await fs.writeFile(target, nextContent);
};

const syncDirectory = async (directory, nodes) => {
    await fs.mkdir(directory, { recursive: true });

    const desiredNames = new Set(
        (Array.isArray(nodes) ? nodes : [])
            .filter(node => node?.name)
            .map(node => safeName(node.name))
    );

    let entries = [];

    try {
        entries = await fs.readdir(
            directory,
            { withFileTypes: true }
        );
    } catch {}

    for (const entry of entries) {
        if (IGNORED_WORKSPACE_ENTRIES.has(entry.name)) {
            continue;
        }

        if (!desiredNames.has(entry.name)) {
            await fs.rm(
                path.join(directory, entry.name),
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }

    for (const node of Array.isArray(nodes) ? nodes : []) {
        await syncEntry(node, directory);
    }
};

const syncProject = async (projectId, userId) => {
    const tree = await getTree({
        projectId,
        userId
    });

    if (!tree.length) {
        throw new Error(
            "Project not found or access denied"
        );
    }

    const root = await ensureWorkspace(projectId);

    const projectNodes =
        tree.length === 1 &&
        tree[0]?.type === "folder"
            ? tree[0].children || []
            : tree;

    await syncDirectory(
        root,
        projectNodes
    );

    return {
        tree,
        root
    };
};

const cleanupExpiredPreviewTokens = () => {
    const now = Date.now();

    for (const [token, session] of previewTokens) {
        if (session.expiresAt <= now) {
            previewTokens.delete(token);
        }
    }
};

const createPreviewToken = ({
    projectId,
    userId,
    root,
    socketId = ""
}) => {
    const token = crypto
        .randomBytes(24)
        .toString("base64url");

    previewTokens.set(token, {
        projectId: String(projectId),
        userId: String(userId),
        root,
        socketId: String(socketId || ""),
        expiresAt:
            Date.now() + PREVIEW_TOKEN_TTL_MS
    });

    return token;
};

const deletePreviewTokensForSocket = socketId => {
    const target = String(socketId || "");

    if (!target) return;

    for (const [token, session] of previewTokens) {
        if (session.socketId === target) {
            previewTokens.delete(token);
        }
    }
};

const buildPreviewUrl = (projectId, token) =>
    `http://localhost:${port}/preview/${projectId}/${token}/`;

const detectProjectPort = output => {
    const text = String(output || "");
    const reservedPorts = new Set([
        Number(process.env.ZS_CODE_FRONTEND_PORT || 5173),
        Number(process.env.PORT || 3005)
    ]);

    let detectedPort = null;
    let match;

    PORT_URL_REGEX.lastIndex = 0;

    while ((match = PORT_URL_REGEX.exec(text))) {
        const detected = Number(match[1]);

        if (
            Number.isInteger(detected) &&
            detected >= 1 &&
            detected <= 65535 &&
            !reservedPorts.has(detected)
        ) {
            detectedPort = detected;
        }
    }

    if (detectedPort) {
        return detectedPort;
    }

    PORT_MESSAGE_REGEX.lastIndex = 0;

    while ((match = PORT_MESSAGE_REGEX.exec(text))) {
        const detected = Number(match[1]);

        if (
            Number.isInteger(detected) &&
            detected >= 1 &&
            detected <= 65535 &&
            !reservedPorts.has(detected)
        ) {
            detectedPort = detected;
        }
    }

    return detectedPort;
};

const previewRoute = /^\/preview\/([a-f\d]{24})\/([A-Za-z0-9_-]+)(?:\/(.*))?$/i;

app.get(previewRoute, async (req, res) => {
    try {
        const match = req.path.match(previewRoute);

        if (!match) {
            return res.status(404).end();
        }

        const projectId = String(match[1]);
        const token = String(match[2]);
        let relativePath = String(match[3] || "");

        if (!isValidProjectId(projectId)) {
            return res.status(400).send("Invalid project ID");
        }

        const session = previewTokens.get(token);

        if (!session) {
            return res.status(401).send("Preview session expired");
        }

        if (
            session.projectId !== projectId ||
            session.expiresAt <= Date.now()
        ) {
            previewTokens.delete(token);
            return res.status(401).send("Preview session expired");
        }

        try {
            relativePath = decodeURIComponent(relativePath);
        } catch {
            return res.status(400).send("Invalid preview path");
        }

        let target = safePreviewRelativePath(
            session.root,
            relativePath
        );

        let stats;

        try {
            stats = await fs.stat(target);
        } catch {
            stats = null;
        }

        if (stats?.isDirectory()) {
            target = path.join(target, "index.html");
        }

        try {
            stats = await fs.stat(target);
        } catch {
            stats = null;
        }

        if (!stats?.isFile()) {
            const hasExtension = Boolean(
                path.extname(relativePath)
            );

            if (!hasExtension) {
                const fallback = safePreviewRelativePath(
                    session.root,
                    "index.html"
                );

                try {
                    const fallbackStats =
                        await fs.stat(fallback);

                    if (fallbackStats.isFile()) {
                        target = fallback;
                        stats = fallbackStats;
                    }
                } catch {}
            }
        }

        if (!stats?.isFile()) {
            return res.status(404).send("Preview file not found");
        }

        const content = await fs.readFile(target);

        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");

        const extension =
            path.extname(target).toLowerCase();

        if (extension === ".html" || extension === ".htm") {
            res.type("html");
        } else {
            res.type(extension || "application/octet-stream");
        }

        return res.send(content);
    } catch (error) {
        console.error(
            "Preview file error:",
            error
        );

        return res.status(500).send(
            "Unable to load preview"
        );
    }
});

app.post("/preview/session", async (req, res) => {
    try {
        const projectId = String(
            req.body?.projectId || ""
        );

        if (!isValidProjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        const userId =
            await getAuthenticatedHttpUser(req);

        const { root } = await syncProject(
            projectId,
            userId
        );

        const token = createPreviewToken({
            projectId,
            userId,
            root
        });

        return res.json({
            success: true,
            projectId,
            previewUrl: buildPreviewUrl(
                projectId,
                token
            ),
            expiresAt:
                Date.now() + PREVIEW_TOKEN_TTL_MS
        });
    } catch (error) {
        console.error(
            "Preview session error:",
            error.message
        );

        return res.status(
            error.message === "Authentication required" ||
            error.message === "Unauthorized"
                ? 401
                : 500
        ).json({
            success: false,
            message: error.message
        });
    }
});

const killSession = socketId => {
    const terminalSession =
        terminalSessions.get(socketId);

    if (!terminalSession) {
        deletePreviewTokensForSocket(socketId);
        return;
    }

    try {
        terminalSession.ptyProcess.kill();
    } catch {}

    terminalSessions.delete(socketId);
    deletePreviewTokensForSocket(socketId);
};

io.use(async (socket, next) => {
    try {
        const version =
            socket.handshake.auth?.protocolVersion;

        if (
            version !== SOCKET_PROTOCOL_VERSION
        ) {
            return next(
                new Error(
                    "Unsupported socket protocol version"
                )
            );
        }

        const userId =
            await getAuthenticatedUser(socket);

        socket.data.userId = userId;
        next();
    } catch (error) {
        console.error(
            `Socket authentication failed: ${error.message}`
        );

        next(
            new Error(
                error.message || "Unauthorized"
            )
        );
    }
});

io.on("connection", socket => {
    console.log(
        `Terminal Connected: ${socket.id} | User: ${socket.data.userId}`
    );

    socket.on("terminal:init", async (data = {}, ack) => {
        try {
            const projectId = String(
                data.projectId || ""
            );
            const userId = socket.data.userId;

            if (!projectId || !userId) {
                throw new Error(
                    "Project ID and authenticated user are required"
                );
            }

            if (!isValidProjectId(projectId)) {
                throw new Error(
                    "Invalid project ID"
                );
            }

            const cols = normalizeCols(data.cols);
            const rows = normalizeRows(data.rows);

            const existingSession =
                terminalSessions.get(socket.id);

            if (existingSession) {
                socket.leave(
                    `project:${existingSession.projectId}`
                );

                try {
                    await stopFilesystemWatcher(
                        existingSession.projectId,
                        socket.id
                    );
                } catch (error) {
                    console.error(
                        `Watcher cleanup failed during project switch for ${socket.id}:`,
                        error.message
                    );
                }

                killSession(socket.id);
            }

            socket.join(`project:${projectId}`);

            const { root } = await syncProject(
                projectId,
                userId
            );

            await startFilesystemWatcher({
                projectId,
                userId,
                root,
                fileServiceUrl,
                clientId: socket.id,
                onSynced: ({ projectId: syncedProjectId }) => {
                    io.to(`project:${syncedProjectId}`).emit(
                        "workspace:changed",
                        {
                            projectId: syncedProjectId,
                            source: "filesystem",
                            timestamp: Date.now()
                        }
                    );
                }
            });

            const previewToken = createPreviewToken({
                projectId,
                userId,
                root,
                socketId: socket.id
            });

            const staticPreviewUrl = buildPreviewUrl(
                projectId,
                previewToken
            );

            const ptyProcess = pty.spawn(
                SHELL,
                SHELL_ARGS,
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

            let outputBuffer = "";
            let detectedPort = null;

            ptyProcess.onData(dataValue => {
                const output =
                    String(dataValue ?? "");

                send(socket, output);

                outputBuffer = (
                    outputBuffer + output
                ).slice(-16384);

                const nextPort =
                    detectProjectPort(
                        outputBuffer
                    );

                if (
                    nextPort &&
                    nextPort !== detectedPort
                ) {
                    detectedPort = nextPort;

                    socket.emit(
                        "terminal:port-detected",
                        {
                            projectId,
                            port: nextPort,
                            previewUrl:
                                `http://localhost:${nextPort}`
                        }
                    );

                    console.log(
                        `[Terminal] Project port detected: ${projectId} → ${nextPort}`
                    );
                }
            });

            ptyProcess.onExit(
                ({ exitCode }) => {
                    send(
                        socket,
                        `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`
                    );

                    const session =
                        terminalSessions.get(
                            socket.id
                        );

                    if (
                        session?.ptyProcess ===
                        ptyProcess
                    ) {
                        terminalSessions.delete(
                            socket.id
                        );

                        deletePreviewTokensForSocket(
                            socket.id
                        );

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
                ptyProcess,
                previewToken,
                staticPreviewUrl
            });

            socket.emit("terminal:ready", {
                protocolVersion:
                    SOCKET_PROTOCOL_VERSION,
                cols,
                rows,
                cwd: root,
                previewUrl:
                    staticPreviewUrl
            });

            ack?.({
                success: true,
                projectId,
                cwd: root,
                previewUrl:
                    staticPreviewUrl
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

    socket.on("terminal:write", data => {
        const terminalSession =
            terminalSessions.get(socket.id);

        if (!terminalSession?.ptyProcess) return;

        try {
            terminalSession.ptyProcess.write(
                String(data ?? "")
            );
        } catch (error) {
            send(
                socket,
                `\r\n\x1b[31m${error.message}\x1b[0m\r\n`
            );
        }
    });

    socket.on("terminal:resize", data => {
        const terminalSession =
            terminalSessions.get(socket.id);

        if (!terminalSession?.ptyProcess) {
            return;
        }

        try {
            terminalSession.ptyProcess.resize(
                normalizeCols(data?.cols),
                normalizeRows(data?.rows)
            );
        } catch (error) {
            send(
                socket,
                `\r\n\x1b[31mResize error: ${error.message}\x1b[0m\r\n`
            );
        }
    });

    socket.on("terminal:restart", async () => {
        const session =
            terminalSessions.get(socket.id);

        if (!session) return;

        try {
            await stopFilesystemWatcher(
                session.projectId,
                socket.id
            );
        } catch (error) {
            console.error(
                `Watcher cleanup failed for restart ${socket.id}:`,
                error.message
            );
        }

        killSession(socket.id);
        socket.emit("terminal:restart");
    });

    socket.on("disconnect", reason => {
        console.log(
            `Terminal Disconnected: ${socket.id} | ${reason}`
        );

        const session =
            terminalSessions.get(socket.id);

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
        activeSessions:
            terminalSessions.size,
        activePreviewSessions:
            previewTokens.size
    });
});

const previewCleanupTimer = setInterval(
    cleanupExpiredPreviewTokens,
    10 * 60 * 1000
);

previewCleanupTimer.unref();

const startServer = async () => {
    try {
        await fs.mkdir(
            getWorkspaceRoot(),
            { recursive: true }
        );

        server.listen(port, () => {
            console.log(
                `Terminal Service is running on Port ${port}`
            );
            console.log(
                `Workspace Root: ${getWorkspaceRoot()}`
            );
            console.log(
                `Shell: ${SHELL}`
            );
            console.log(
                `Auth Service: ${authServiceUrl}`
            );
        });
    } catch (error) {
        console.error(
            "Terminal Service startup failed:",
            error
        );
        process.exit(1);
    }
};

const shutdown = async () => {
    clearInterval(previewCleanupTimer);

    for (const socketId of terminalSessions.keys()) {
        killSession(socketId);
    }

    await stopAllFilesystemWatchers();
    previewTokens.clear();

    server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
