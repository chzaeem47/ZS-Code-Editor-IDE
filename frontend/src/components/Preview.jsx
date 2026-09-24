import { useCallback, useEffect, useState } from "react";
import {
    FaDesktop,
    FaExpand,
    FaSyncAlt
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const TERMINAL_URL =
    import.meta.env.VITE_TERMINAL_URL ||
    "http://localhost:3005";

const Preview = () => {
    const { isDark } = useTheme();

    const [project, setProject] = useState(null);
    const [staticPreviewUrl, setStaticPreviewUrl] = useState("");
    const [detectedPort, setDetectedPort] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const requestStaticPreview = useCallback(
        async (projectId, silent = false) => {
            if (!projectId) return;

            if (!silent) {
                setLoading(true);
            }

            try {
                const response = await fetch(
                    `${TERMINAL_URL}/preview/session`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            projectId
                        })
                    }
                );

                const text = await response.text();
                let data = {};

                try {
                    data = text ? JSON.parse(text) : {};
                } catch {
                    throw new Error(
                        "Invalid preview service response"
                    );
                }

                if (!response.ok || !data?.success) {
                    throw new Error(
                        data?.message ||
                        `Preview service returned ${response.status}`
                    );
                }

                setStaticPreviewUrl(
                    String(data.previewUrl || "")
                );
                setError("");
                setReloadKey(value => value + 1);
            } catch (previewError) {
                console.error(
                    "ZS Code static preview:",
                    previewError
                );

                if (!silent) {
                    setError(
                        previewError?.message ||
                        "Unable to prepare project preview."
                    );
                }
            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        const openProject = event => {
            const value = event.detail || null;

            setProject(value);
            setDetectedPort(null);
            setPreviewUrl("");
            setStaticPreviewUrl("");
            setError("");
            setReloadKey(value => value + 1);
        };

        const activeProject = event => {
            const value = event.detail;

            if (!value?._id) return;

            setProject(value);
            setDetectedPort(null);
            setPreviewUrl("");
            setStaticPreviewUrl("");
            setError("");
            setReloadKey(value => value + 1);
        };

        const deletedProjects = event => {
            const ids = event.detail?.projectIds || [];

            setProject(current =>
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
            new CustomEvent(
                "zs-code-request-active-project"
            )
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

    useEffect(() => {
        if (!project?._id) {
            return;
        }

        requestStaticPreview(project._id);
    }, [
        project?._id,
        requestStaticPreview
    ]);

    useEffect(() => {
        const refresh = event => {
            const projectId = event.detail?.projectId;

            if (
                project?._id &&
                (!projectId ||
                    String(projectId) === String(project._id))
            ) {
                setReloadKey(value => value + 1);

                if (!detectedPort) {
                    requestStaticPreview(
                        project._id,
                        true
                    );
                }
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

        window.addEventListener(
            "zs-code-workspace-changed",
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

            window.removeEventListener(
                "zs-code-workspace-changed",
                refresh
            );
        };
    }, [
        project?._id,
        detectedPort,
        requestStaticPreview
    ]);

    useEffect(() => {
        const handleStaticPreviewReady = event => {
            const detail = event.detail || {};

            if (
                detail.projectId &&
                project?._id &&
                String(detail.projectId) !==
                    String(project._id)
            ) {
                return;
            }

            if (!detail.previewUrl) return;

            setStaticPreviewUrl(
                String(detail.previewUrl)
            );
            setReloadKey(value => value + 1);
        };

        const handlePortDetected = event => {
            const detail = event.detail || {};
            const eventProjectId = detail.projectId;

            if (
                eventProjectId &&
                project?._id &&
                String(eventProjectId) !==
                    String(project._id)
            ) {
                return;
            }

            if (!detail.port) return;

            setDetectedPort(detail.port);
            setPreviewUrl(
                detail.previewUrl ||
                `http://localhost:${detail.port}`
            );
            setReloadKey(value => value + 1);
        };

        window.addEventListener(
            "zs-code-static-preview-ready",
            handleStaticPreviewReady
        );

        window.addEventListener(
            "zs-code-port-detected",
            handlePortDetected
        );

        return () => {
            window.removeEventListener(
                "zs-code-static-preview-ready",
                handleStaticPreviewReady
            );

            window.removeEventListener(
                "zs-code-port-detected",
                handlePortDetected
            );
        };
    }, [project?._id]);

    const currentPreviewUrl =
        previewUrl || staticPreviewUrl;

    const openPreviewInNewTab = useCallback(() => {
        if (!currentPreviewUrl) return;

        window.open(
            currentPreviewUrl,
            "_blank",
            "noopener,noreferrer"
        );
    }, [currentPreviewUrl]);

    if (!project) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${isDark
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

    if (loading && !currentPreviewUrl) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${isDark
                    ? "bg-[#0d1117] text-white/35"
                    : "bg-white text-slate-400"
                    }`}
            >
                <div className="text-center">
                    <FaSyncAlt className="mx-auto mb-3 animate-spin text-xl opacity-60" />

                    <p className="font-plex text-sm">
                        Preparing project preview...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !currentPreviewUrl) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${isDark
                    ? "bg-[#0d1117] text-red-300"
                    : "bg-white text-red-500"
                    }`}
            >
                <div className="max-w-md px-6 text-center">
                    <p className="font-plex text-sm">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            requestStaticPreview(
                                project._id
                            )
                        }
                        className={`mt-4 rounded-md px-3 py-2 font-plex text-xs transition ${isDark
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        Retry Preview
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-hidden bg-white ai-chat-scroll">
            <div
                className={`absolute right-5 top-1 z-10 flex items-center rounded-lg p-1 backdrop-blur-md ${isDark
                    ? "bg-[#161b22]/90"
                    : "bg-white/90 shadow-md"
                    }`}
            >
                {detectedPort && (
                    <button
                        type="button"
                        onClick={openPreviewInNewTab}
                        title={`Running on port ${detectedPort}`}
                        className={`flex h-8 items-center gap-1.5 rounded-md px-2 font-plex text-[10px] transition ${isDark
                            ? "text-green-400 hover:bg-white/10"
                            : "text-green-600 hover:bg-slate-100"
                            }`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>:{detectedPort}</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={openPreviewInNewTab}
                    title="Open preview in new tab"
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${isDark
                        ? "text-white/70 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                >
                    <FaExpand size={15} />
                </button>
            </div>

            <iframe
                key={`${currentPreviewUrl}-${reloadKey}`}
                title="ZS CODE Preview"
                src={currentPreviewUrl || undefined}
                className="h-full w-full border-0"
            />
        </div>
    );
};

export default Preview;
