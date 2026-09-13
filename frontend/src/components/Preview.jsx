import { useCallback, useEffect, useMemo, useState } from "react";
import { FaDesktop, FaSyncAlt } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { getFile, getFileTree } from "../features/file";

const ext = (f) =>
    (f?.extension || f?.name?.split(".").pop() || "").toLowerCase();

const isHtml = (f) => ["html", "htm"].includes(ext(f));
const isCss = (f) => ext(f) === "css";
const isJs = (f) => ext(f) === "js";

const normalize = (path = "") =>
    String(path)
        .replace(/\\/g, "/")
        .split("/")
        .reduce((out, part) => {
            if (!part || part === ".") return out;
            if (part === "..") out.pop();
            else out.push(part);
            return out;
        }, [])
        .join("/");

const dirname = (path) => {
    const value = normalize(path);
    const index = value.lastIndexOf("/");
    return index < 0 ? "" : value.slice(0, index);
};

const cleanRef = (value) =>
    String(value || "")
        .trim()
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

const external = (value) =>
    /^(https?:|\/\/|data:|blob:|mailto:|tel:|javascript:|#)/i.test(
        String(value || "").trim()
    );

const resolvePath = (from, ref) => {
    const value = cleanRef(ref);
    if (!value) return "";
    return normalize(
        value.startsWith("/")
            ? value.slice(1)
            : `${dirname(from)}/${value}`
    );
};

const flatten = (nodes = [], result = [], parent = "") => {
    for (const node of nodes) {
        if (!node?.name) continue;

        const path = normalize(
            parent ? `${parent}/${node.name}` : node.name
        );

        if (node.type === "file") {
            result.push({ ...node, __path: path });
        }

        if (Array.isArray(node.children)) {
            flatten(node.children, result, path);
        }
    }

    return result;
};

const findFile = (files, path) => {
    const target = normalize(path);

    return (
        files.find((file) => normalize(file.__path) === target) ||
        files.find(
            (file) =>
                normalize(file.__path).toLowerCase() ===
                target.toLowerCase()
        ) ||
        null
    );
};

const contentOf = (file) => {
    if (!file) return "";
    return typeof file.content === "string"
        ? file.content
        : String(file.content ?? "");
};

const fileResponse = (response) => {
    if (!response) return null;
    if (response.file) return response.file;
    if (response.data?.file) return response.data.file;
    if (response.data) return response.data;
    return response;
};

const escapeScript = (value) =>
    String(value || "").replace(/<\/script/gi, "<\\/script");

const escapeStyle = (value) =>
    String(value || "").replace(/<\/style/gi, "<\\/style");

const Preview = () => {
    const { isDark } = useTheme();
    const { activeFile } = useWorkspace();

    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    /* Project events */
    useEffect(() => {
        const openProject = (event) => {
            const value = event.detail || null;
            setProject(value);
            setReloadKey((v) => v + 1);
        };

        const activeProject = (event) => {
            const value = event.detail;

            if (!value?._id) return;

            setProject(value);
            setReloadKey((v) => v + 1);
        };

        const deletedProjects = (event) => {
            const ids = event.detail?.projectIds || [];

            setProject((current) =>
                current && ids.includes(current._id)
                    ? null
                    : current
            );
        };

        window.addEventListener(
            "zs-code-open-project",
            openProject
        );

        window.addEventListener(
            "zs-code-active-project-response",
            activeProject
        );

        window.addEventListener(
            "zs-code-projects-deleted",
            deletedProjects
        );

        window.dispatchEvent(
            new CustomEvent("zs-code-request-active-project")
        );

        return () => {
            window.removeEventListener(
                "zs-code-open-project",
                openProject
            );

            window.removeEventListener(
                "zs-code-active-project-response",
                activeProject
            );

            window.removeEventListener(
                "zs-code-projects-deleted",
                deletedProjects
            );
        };
    }, []);

    /* Refresh preview when files change */
    useEffect(() => {
        const refresh = (event) => {
            const projectId = event.detail?.projectId;

            if (
                project?._id &&
                (!projectId || projectId === project._id)
            ) {
                setReloadKey((v) => v + 1);
            }
        };

        window.addEventListener(
            "zs-code-preview-changed",
            refresh
        );

        window.addEventListener(
            "zs-code-file-tree-changed",
            refresh
        );

        return () => {
            window.removeEventListener(
                "zs-code-preview-changed",
                refresh
            );

            window.removeEventListener(
                "zs-code-file-tree-changed",
                refresh
            );
        };
    }, [project?._id]);

    /* Load every project file */
    const loadFiles = useCallback(async () => {
        if (!project?._id) {
            setFiles([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const tree = await getFileTree(project._id);
            const nodes = flatten(tree);

            const loaded = await Promise.all(
                nodes.map(async (node) => {
                    try {
                        const response = await getFile(
                            node._id || node.id
                        );

                        const file = fileResponse(response);

                        return {
                            ...node,
                            ...(file || {}),
                            __path: node.__path,
                        };
                    } catch (err) {
                        console.error(
                            "Preview file load:",
                            node.name,
                            err
                        );

                        return {
                            ...node,
                            content: "",
                            __path: node.__path,
                        };
                    }
                })
            );

            console.log(
                "ZS CODE Preview files:",
                loaded.map((file) => ({
                    name: file.name,
                    path: file.__path,
                    type: file.type,
                    contentLength: contentOf(file).length,
                }))
            );

            setFiles(loaded);
        } catch (err) {
            console.error("Preview load:", err);

            setFiles([]);

            setError(
                err?.response?.data?.message ||
                    "Unable to load project preview."
            );
        } finally {
            setLoading(false);
        }
    }, [project?._id]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles, reloadKey]);

    /* Find entry HTML */
    const htmlFile = useMemo(() => {
        if (!files.length) return null;

        const activeId = activeFile?._id || activeFile?.id;

        const activeHtml = files.find(
            (file) =>
                (file._id || file.id) === activeId &&
                isHtml(file)
        );

        return (
            activeHtml ||
            files.find(
                (file) =>
                    file.name?.toLowerCase() === "index.html"
            ) ||
            files.find(isHtml) ||
            null
        );
    }, [files, activeFile]);

    /* Build complete preview */
    const srcDoc = useMemo(() => {
        if (!htmlFile) return "";

        let html = contentOf(htmlFile);

        console.log(
            "PREVIEW HTML CONTENT:",
            JSON.stringify(html)
        );

        /*
         * Convert escaped quotes that sometimes come from
         * AI-generated file content.
         */
        html = html.replace(/\\"/g, '"');

        /*
         * Allow users to write only:
         *
         * <h1>Hello</h1>
         */
        if (!/<html[\s>]/i.test(html)) {
            html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${html}
</body>
</html>`;
        }

        const htmlPath = normalize(htmlFile.__path);

        /* ---------------- CSS ---------------- */

        const cssFiles = files.filter(isCss);

        html = html.replace(
            /<link\b([^>]*?)href\s*=\s*(["'])(.*?)\2([^>]*)>/gi,
            (match, before, quote, href, after) => {
                const value = cleanRef(href);

                if (external(value)) return match;

                const target = findFile(
                    files,
                    resolvePath(htmlPath, value)
                );

                if (!target || !isCss(target)) {
                    return match;
                }

                return `
<style>
${escapeStyle(contentOf(target))}
</style>`;
            }
        );

        /*
         * Automatically include style.css when the HTML
         * does not already link it.
         */
        const hasStyle =
            /<style[\s>]/i.test(html) ||
            /<link[^>]+stylesheet/i.test(html);

        if (cssFiles.length && !hasStyle) {
            const mainCss =
                cssFiles.find(
                    (file) =>
                        file.name?.toLowerCase() ===
                        "style.css"
                ) || cssFiles[0];

            const css = contentOf(mainCss);

            html = html.replace(
                /<\/head>/i,
                `<style>
${escapeStyle(css)}
</style>
</head>`
            );
        }

        /* ---------------- JavaScript ---------------- */

        html = html.replace(
            /<script\b([^>]*?)src\s*=\s*(["'])(.*?)\2([^>]*)>\s*<\/script>/gi,
            (match, before, quote, src, after) => {
                const value = cleanRef(src);

                if (external(value)) return match;

                const target = findFile(
                    files,
                    resolvePath(htmlPath, value)
                );

                if (!target || !isJs(target)) {
                    return match;
                }

                return `
<script>
${escapeScript(contentOf(target))}
<\/script>`;
            }
        );

        /*
         * Automatically include script.js when the user
         * has not manually added a <script src="...">.
         */
        const hasScript = /<script\b/i.test(html);
        const jsFiles = files.filter(isJs);

        if (jsFiles.length && !hasScript) {
            const mainJs =
                jsFiles.find(
                    (file) =>
                        file.name?.toLowerCase() ===
                        "script.js"
                ) || jsFiles[0];

            html = html.replace(
                /<\/body>/i,
                `<script>
${escapeScript(contentOf(mainJs))}
<\/script>
</body>`
            );
        }

        /*
         * Prevent local HTML preview links from accidentally
         * breaking the iframe where possible.
         */
        html = html.replace(
            /\s+href\s*=\s*(["'])([^"']+)\1/gi,
            (match, quote, href) => {
                const value = cleanRef(href);

                if (
                    value.endsWith(".html") ||
                    value.endsWith(".htm")
                ) {
                    return ` href=${quote}#${quote}`;
                }

                return match;
            }
        );

        /*
         * Preview base styling.
         */
        if (!/data-zs-preview/i.test(html)) {
            const style = `
<style data-zs-preview>
html,
body {
    margin: 0;
    padding: 0;
    min-height: 100%;
}
</style>`;

            if (/<\/head>/i.test(html)) {
                html = html.replace(
                    /<\/head>/i,
                    `${style}</head>`
                );
            } else {
                html = `${style}${html}`;
            }
        }

        console.log(
            "ZS CODE Preview srcDoc length:",
            html.length
        );

        return html;
    }, [files, htmlFile]);

    if (!project) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${
                    isDark
                        ? "bg-[#0d1117] text-white/30"
                        : "bg-white text-slate-400"
                }`}
            >
                <div className="text-center">
                    <FaDesktop className="mx-auto mb-4 text-5xl opacity-40" />
                    <p className="font-plex text-[15px]">
                        Open a project to preview it
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${
                    isDark
                        ? "bg-[#0d1117] text-white/35"
                        : "bg-white text-slate-400"
                }`}
            >
                <div className="text-center">
                    <FaSyncAlt className="mx-auto mb-3 animate-spin text-xl opacity-60" />
                    <p className="font-plex text-sm">
                        Loading project preview...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${
                    isDark
                        ? "bg-[#0d1117] text-red-300"
                        : "bg-white text-red-500"
                }`}
            >
                <p className="max-w-md px-6 text-center font-plex text-sm">
                    {error}
                </p>
            </div>
        );
    }

    if (!htmlFile) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${
                    isDark
                        ? "bg-[#0d1117] text-white/35"
                        : "bg-white text-slate-400"
                }`}
            >
                <div className="text-center">
                    <FaDesktop className="mx-auto mb-4 text-4xl opacity-40" />
                    <p className="font-plex text-sm">
                        No HTML entry file found.
                    </p>
                    <p className="mt-1 text-xs opacity-60">
                        Create index.html to start the preview.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden bg-white">
            <iframe
                key={`${htmlFile._id || htmlFile.id}-${reloadKey}-${srcDoc.length}`}
                title="ZS CODE Preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-forms allow-modals"
                className="h-full w-full border-0"
            />
        </div>
    );
};

export default Preview;
