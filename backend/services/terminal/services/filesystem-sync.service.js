import fs from "fs/promises";
import path from "path";
import chokidar from "chokidar";

const watchers = new Map();
const syncTimers = new Map();

const DEBOUNCE_MS = 700;

const safePath = (root, relativePath) => {
    const target = path.resolve(root, relativePath);
    const resolvedRoot = path.resolve(root);

    if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
        throw new Error("Invalid filesystem path");
    }

    return target;
};

const buildTree = async (directory, relative = "") => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const tree = [];

    for (const entry of entries) {
        const relativePath = path.join(relative, entry.name);
        const fullPath = safePath(directory, relativePath);

        if (entry.isDirectory()) {
            tree.push({
                name: entry.name,
                type: "folder",
                children: await buildTree(fullPath, relativePath)
            });
            continue;
        }

        if (entry.isFile()) {
            const content = await fs.readFile(fullPath, "utf8");

            tree.push({
                name: entry.name,
                type: "file",
                content
            });
        }
    }

    return tree;
};

const syncToDatabase = async ({ projectId, userId, root, fileServiceUrl }) => {
    const tree = await buildTree(root);

    const response = await fetch(
        `${fileServiceUrl}/sync/${projectId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": String(userId)
            },
            body: JSON.stringify({ tree })
        }
    );

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(`Invalid File Service sync response: ${text}`);
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `File Service sync failed with ${response.status}`
        );
    }

    return data;
};

const scheduleSync = ({ projectId, userId, root, fileServiceUrl }) => {
    const existingTimer = syncTimers.get(projectId);

    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
        syncTimers.delete(projectId);

        try {
            await syncToDatabase({
                projectId,
                userId,
                root,
                fileServiceUrl
            });

            console.log(`Filesystem → DB synced: ${projectId}`);
        } catch (error) {
            console.error(
                `Filesystem sync failed for ${projectId}:`,
                error.message
            );
        }
    }, DEBOUNCE_MS);

    syncTimers.set(projectId, timer);
};

export const startFilesystemWatcher = ({
    projectId,
    userId,
    root,
    fileServiceUrl
}) => {
    stopFilesystemWatcher(projectId);

    const watcher = chokidar.watch(root, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    });

    const changed = () => {
        scheduleSync({
            projectId,
            userId,
            root,
            fileServiceUrl
        });
    };

    watcher.on("add", changed);
    watcher.on("change", changed);
    watcher.on("unlink", changed);
    watcher.on("addDir", changed);
    watcher.on("unlinkDir", changed);

    watcher.on("error", error => {
        console.error(
            `Filesystem watcher error for ${projectId}:`,
            error
        );
    });

    watchers.set(projectId, watcher);

    console.log(`Filesystem watcher started: ${projectId}`);

    return watcher;
};

export const stopFilesystemWatcher = async projectId => {
    const watcher = watchers.get(projectId);

    if (watcher) {
        await watcher.close();
        watchers.delete(projectId);
    }

    const timer = syncTimers.get(projectId);

    if (timer) {
        clearTimeout(timer);
        syncTimers.delete(projectId);
    }
};