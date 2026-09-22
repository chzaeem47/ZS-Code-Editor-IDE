import fs from "fs/promises";
import path from "path";
import chokidar from "chokidar";

const watchers = new Map();
const watcherClients = new Map();
const watcherReady = new Map();
const syncTimers = new Map();
const syncStates = new Map();

const DEBOUNCE_MS = 700;
const IGNORED = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo"
]);

const safePath = (root, relativePath) => {
    const resolvedRoot = path.resolve(root);
    const target = path.resolve(root, relativePath);

    if (
        target !== resolvedRoot &&
        !target.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
        throw new Error("Invalid filesystem path");
    }

    return target;
};

const buildTree = async (root, directory = root, relative = "") => {
    let entries;

    try {
        entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT" && directory !== root) return [];
        throw error;
    }

    const tree = [];

    for (const entry of entries) {
        if (IGNORED.has(entry.name)) continue;
        if (entry.isSymbolicLink()) continue;

        const relativePath = path.join(relative, entry.name);
        const fullPath = safePath(root, relativePath);

        if (entry.isDirectory()) {
            tree.push({
                name: entry.name,
                type: "folder",
                children: await buildTree(root, fullPath, relativePath)
            });
            continue;
        }

        if (entry.isFile()) {
            try {
                const content = await fs.readFile(fullPath, "utf8");

                tree.push({
                    name: entry.name,
                    type: "file",
                    content
                });
            } catch (error) {
                console.warn(
                    `Skipping file ${fullPath}: ${error.message}`
                );
            }
        }
    }

    return tree.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
    });
};

const syncToDatabase = async ({
    projectId,
    userId,
    root,
    fileServiceUrl
}) => {
    const tree = await buildTree(root);

    const response = await fetch(
        `${fileServiceUrl}/sync/${projectId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": String(userId),
                "x-sync-source": "filesystem"
            },
            body: JSON.stringify({ tree })
        }
    );

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            `Invalid File Service sync response: ${text}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `File Service sync failed with ${response.status}`
        );
    }

    return {
        data , tree
    };
};

const performSync = async context => {
    const { projectId, onSynced } = context;

    let state = syncStates.get(projectId);

    if (!state) {
        state = {
            running: false,
            pending: false
        };

        syncStates.set(projectId, state);
    }

    if (state.running) {
        state.pending = true;
        return;
    }

    state.running = true;

    try {
        do {
            state.pending = false;

            const result = await syncToDatabase(context);

            console.log(`Filesystem → DB synced: ${projectId}`);

            await onSynced?.({
                projectId,
                tree: result?.tree || null
            });
        } while (state.pending);
    } catch (error) {
        console.error(
            `Filesystem sync failed for ${projectId}:`,
            error.message
        );
    } finally {
        state.running = false;

        if (!state.pending) {
            syncStates.delete(projectId);
        }
    }
};

const scheduleSync = context => {
    const { projectId } = context;

    const existing = syncTimers.get(projectId);

    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(() => {
        syncTimers.delete(projectId);
        performSync(context);
    }, DEBOUNCE_MS);

    syncTimers.set(projectId, timer);
};

export const startFilesystemWatcher = async ({
    projectId,
    userId,
    root,
    fileServiceUrl,
    clientId,
    onSynced
}) => {
    const clientKey = String(clientId || projectId);

    let clients = watcherClients.get(projectId);

    if (!clients) {
        clients = new Set();
        watcherClients.set(projectId, clients);
    }

    clients.add(clientKey);

    const existingWatcher = watchers.get(projectId);

    if (existingWatcher) {
        const ready = watcherReady.get(projectId);

        if (ready) {
            await ready;
        }

        return existingWatcher;
    }

    const watchRoot =
        process.platform === "win32"
            ? await fs.realpath(root)
            : root;

    const watcher = chokidar.watch(watchRoot, {
        persistent: true,
        ignoreInitial: true,
        interval: 300,
        usePolling: process.platform === "win32",
        followSymlinks: false,
        ignorePermissionErrors: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        },
        ignored: filePath => {
            const relative = path.relative(
                watchRoot,
                filePath
            );

            return relative
                .split(path.sep)
                .some(part => IGNORED.has(part));
        }
    });

    watchers.set(projectId, watcher);

    const readyPromise = new Promise((resolve, reject) => {
        watcher.once("ready", resolve);
        watcher.once("error", reject);
    });

    watcherReady.set(projectId, readyPromise);

    const changed = (event, filePath) => {
        const relativePath =
            path.relative(watchRoot, filePath) || ".";

        console.log(
            `[FS ${event}] ${projectId}: ${relativePath}`
        );

        scheduleSync({
            projectId,
            userId,
            root: watchRoot,
            fileServiceUrl,
            onSynced
        });
    };

    watcher.on("add", filePath =>
        changed("add", filePath)
    );

    watcher.on("change", filePath =>
        changed("change", filePath)
    );

    watcher.on("unlink", filePath =>
        changed("unlink", filePath)
    );

    watcher.on("addDir", filePath =>
        changed("addDir", filePath)
    );

    watcher.on("unlinkDir", filePath =>
        changed("unlinkDir", filePath)
    );

    watcher.on("error", error => {
        console.error(
            `Filesystem watcher error for ${projectId}:`,
            error.message
        );
    });

    try {
        await readyPromise;

        console.log(
            `Filesystem watcher ready: ${projectId}`
        );

        return watcher;
    } catch (error) {
        await watcher.close();

        watchers.delete(projectId);
        watcherClients.delete(projectId);
        watcherReady.delete(projectId);

        throw error;
    }
};

export const stopFilesystemWatcher = async (
    projectId,
    clientId
) => {
    const clients = watcherClients.get(projectId);

    if (clients && clientId) {
        clients.delete(String(clientId));

        if (clients.size > 0) {
            return;
        }
    }

    const watcher = watchers.get(projectId);

    if (watcher) {
        try {
            await watcher.close();
        } catch (error) {
            console.error(
                `Watcher close failed for ${projectId}:`,
                error.message
            );
        }

        watchers.delete(projectId);
    }

    watcherClients.delete(projectId);
    watcherReady.delete(projectId);

    const timer = syncTimers.get(projectId);

    if (timer) {
        clearTimeout(timer);
        syncTimers.delete(projectId);
    }

    syncStates.delete(projectId);

    console.log(
        `Filesystem watcher stopped: ${projectId}`
    );
};

export const stopAllFilesystemWatchers = async () => {
    const projectIds = [...watchers.keys()];

    await Promise.all(
        projectIds.map(projectId =>
            stopFilesystemWatcher(projectId)
        )
    );
};