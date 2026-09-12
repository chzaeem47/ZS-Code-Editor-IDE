import { useCallback, useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import {
    FaCheck, FaClipboard, FaCode, FaCopy, FaCut,
    FaExclamationCircle, FaExclamationTriangle, FaFileCode,
    FaRedo, FaSearch, FaUndo
} from "react-icons/fa";
import { FiChevronDown, FiGitBranch, FiInfo, FiX } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { updateFile } from "../features/file";

const getLanguage = (file) => {
    const name = (file?.name || "").toLowerCase();
    const ext = (file?.extension || name.split(".").pop() || "").toLowerCase();

    if (name === "dockerfile" || name.startsWith("dockerfile.")) return "dockerfile";
    if (
        name === ".gitignore" || name === ".gitattributes" ||
        name === ".env" || name.startsWith(".env.")
    ) return "plaintext";

    const languages = {
        js: "javascript", mjs: "javascript", cjs: "javascript",
        jsx: "javascriptreact",
        ts: "typescript", mts: "typescript", cts: "typescript",
        tsx: "typescriptreact",
        json: "json", jsonc: "jsonc",
        css: "css", scss: "scss", sass: "scss", less: "less",
        html: "html", htm: "html",
        md: "markdown", mdx: "markdown",
        yaml: "yaml", yml: "yaml",
        xml: "xml", svg: "xml",
        py: "python", pyw: "python",
        php: "php", java: "java",
        c: "c", h: "cpp", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
        cs: "csharp",
        go: "go", rs: "rust",
        rb: "ruby", rake: "ruby",
        swift: "swift",
        kt: "kotlin", kts: "kotlin",
        dart: "dart",
        sh: "shell", bash: "shell", zsh: "shell", fish: "shell",
        ps1: "powershell", psm1: "powershell", psd1: "powershell",
        sql: "sql",
        vue: "html", svelte: "html", astro: "html"
    };

    return languages[ext] || "plaintext";
};

const languageNames = {
    javascript: "JavaScript",
    javascriptreact: "JavaScript React",
    typescript: "TypeScript",
    typescriptreact: "TypeScript React",
    json: "JSON",
    jsonc: "JSON with Comments",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    less: "Less",
    html: "HTML",
    markdown: "Markdown",
    yaml: "YAML",
    xml: "XML",
    python: "Python",
    php: "PHP",
    java: "Java",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    swift: "Swift",
    kotlin: "Kotlin",
    dart: "Dart",
    shell: "Shell Script",
    powershell: "PowerShell",
    sql: "SQL",
    dockerfile: "Dockerfile",
    plaintext: "Plain Text"
};

const MenuItem = ({ icon: Icon, label, onClick, disabled = false, shortcut }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[12px] transition-colors ${
            disabled ? "cursor-not-allowed opacity-35" : "hover:bg-white/10"
        }`}
    >
        <span className="flex w-4 shrink-0 justify-center text-[11px]"><Icon /></span>
        <span className="flex-1">{label}</span>
        {shortcut && <span className="text-[10px] opacity-40">{shortcut}</span>}
    </button>
);

const StatusButton = ({ children, onClick, title, isDark, active = false }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`flex h-full items-center gap-1.5 whitespace-nowrap px-2 text-[11px] font-medium transition-all ${
            active
                ? isDark
                    ? "bg-white/[0.08] text-white"
                    : "bg-black/[0.06] text-slate-900"
                : isDark
                    ? "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    : "text-slate-500 hover:bg-black/[0.05] hover:text-slate-900"
        }`}
    >
        {children}
    </button>
);

const Editor = () => {
    const { isDark } = useTheme();
    const { activeFile, updateOpenFile } = useWorkspace();

    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const saveTimersRef = useRef(new Map());
    const pendingContentRef = useRef(new Map());
    const savingFilesRef = useRef(new Set());
    const saveStatesRef = useRef(new Map());
    const markerListenerRef = useRef(null);

    const [saveState, setSaveState] = useState("saved");
    const [contextMenu, setContextMenu] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [selectionInfo, setSelectionInfo] = useState({ chars: 0, lines: 0 });
    const [markers, setMarkers] = useState([]);
    const [problemsOpen, setProblemsOpen] = useState(false);
    const [indentation, setIndentation] = useState({ spaces: true, size: 2 });
    const [lineEnding, setLineEnding] = useState("LF");
    const [encodingOpen, setEncodingOpen] = useState(false);
    const [indentationOpen, setIndentationOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);

    const fileId = activeFile?._id || activeFile?.id;
    const language = getLanguage(activeFile);
    const languageDisplay = languageNames[language] || language;

    const errorCount = markers.filter(m => m.severity === 8).length;
    const warningCount = markers.filter(m => m.severity === 4).length;

    const setFileSaveState = useCallback((id, state) => {
        if (!id) return;
        saveStatesRef.current.set(id, state);
        if (id === fileId) setSaveState(state);
    }, [fileId]);

    const performSave = useCallback(async id => {
        if (!id || savingFilesRef.current.has(id)) return;

        const content = pendingContentRef.current.get(id);
        if (content === undefined) return;

        pendingContentRef.current.delete(id);
        savingFilesRef.current.add(id);
        setFileSaveState(id, "saving");

        try {
            await updateFile(id, { content });
            setFileSaveState(id, "saved");
        } catch (error) {
            console.error("Auto-save failed:", error);
            pendingContentRef.current.set(id, content);
            setFileSaveState(id, "error");
        } finally {
            savingFilesRef.current.delete(id);

            if (pendingContentRef.current.has(id)) {
                const oldTimer = saveTimersRef.current.get(id);
                if (oldTimer) clearTimeout(oldTimer);

                const timer = setTimeout(() => {
                    saveTimersRef.current.delete(id);
                    performSave(id);
                }, 350);

                saveTimersRef.current.set(id, timer);
            }
        }
    }, [setFileSaveState]);

    const scheduleSave = useCallback((id, content) => {
        if (!id) return;

        pendingContentRef.current.set(id, content);
        setFileSaveState(id, "unsaved");

        const oldTimer = saveTimersRef.current.get(id);
        if (oldTimer) clearTimeout(oldTimer);

        const timer = setTimeout(() => {
            saveTimersRef.current.delete(id);
            performSave(id);
        }, 800);

        saveTimersRef.current.set(id, timer);
    }, [performSave, setFileSaveState]);

    useEffect(() => {
        if (!fileId) return;
        setSaveState(saveStatesRef.current.get(fileId) || "saved");
    }, [fileId]);

    useEffect(() => () => {
        saveTimersRef.current.forEach(timer => clearTimeout(timer));
    }, []);

    const runEditorAction = async actionId => {
        const action = editorRef.current?.getAction(actionId);
        if (action) await action.run();
        editorRef.current?.focus();
    };

    const formatDocument = () => runEditorAction("editor.action.formatDocument");

    const copySelection = async () => {
        const editor = editorRef.current;
        const selection = editor?.getSelection();
        if (!editor || !selection || selection.isEmpty()) return;

        const text = editor.getModel().getValueInRange(selection);

        try {
            await navigator.clipboard.writeText(text);
            editor.focus();
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    const cutSelection = async () => {
        const editor = editorRef.current;
        const selection = editor?.getSelection();
        if (!editor || !selection || selection.isEmpty()) return;

        const text = editor.getModel().getValueInRange(selection);

        try {
            await navigator.clipboard.writeText(text);
            editor.executeEdits("zs-code-cut", [{
                range: selection,
                text: "",
                forceMoveMarkers: true
            }]);
            editor.focus();
        } catch (error) {
            console.error("Cut failed:", error);
        }
    };

    const pasteClipboard = async () => {
        const editor = editorRef.current;
        if (!editor) return;

        try {
            const text = await navigator.clipboard.readText();
            const selection = editor.getSelection();
            if (!selection) return;

            editor.executeEdits("zs-code-paste", [{
                range: selection,
                text,
                forceMoveMarkers: true
            }]);

            editor.focus();
        } catch (error) {
            console.error("Paste failed:", error);
        }
    };

    const selectAll = () => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;

        editor.setSelection(model.getFullModelRange());
        editor.focus();
    };

    const openContextMenu = event => {
        event.preventDefault();
        event.stopPropagation();

        const editor = editorRef.current;
        const selection = editor?.getSelection();
        const hasSelection = !!selection && !selection.isEmpty();
        const width = 220;
        const height = 405;
        const pad = 8;

        setContextMenu({
            x: Math.max(pad, Math.min(event.clientX, window.innerWidth - width - pad)),
            y: Math.max(pad, Math.min(event.clientY, window.innerHeight - height - pad)),
            hasSelection
        });
    };

    useEffect(() => {
        const close = () => setContextMenu(null);

        document.addEventListener("mousedown", close);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);

        return () => {
            document.removeEventListener("mousedown", close);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, []);

    const handleBeforeMount = monaco => {
        monacoRef.current = monaco;

        monaco.editor.defineTheme("zs-code-dark", {
            base: "vs-dark",
            inherit: true,
            semanticHighlighting: true,
            rules: [
                { token: "comment", foreground: "6A9955" },
                { token: "keyword", foreground: "C586C0" },
                { token: "string", foreground: "CE9178" },
                { token: "number", foreground: "B5CEA8" },
                { token: "type", foreground: "4EC9B0" },
                { token: "type.identifier", foreground: "4EC9B0" },
                { token: "function", foreground: "DCDCAA" },
                { token: "function.declaration", foreground: "DCDCAA" },
                { token: "tag", foreground: "569CD6" },
                { token: "delimiter.tag", foreground: "808080" },
                { token: "attribute.name", foreground: "9CDCFE" },
                { token: "operator", foreground: "D4D4D4" }
            ],
            colors: {
                "editor.background": "#0d1117",
                "editor.foreground": "#D4D4D4",
                "editorLineNumber.foreground": "#4b5563",
                "editorLineNumber.activeForeground": "#cbd5e1",
                "editorCursor.foreground": "#22d3ee",
                "editor.lineHighlightBackground": "#ffffff08",
                "editor.selectionBackground": "#264f78",
                "editor.inactiveSelectionBackground": "#264f7855",
                "editorIndentGuide.background1": "#ffffff0a",
                "editorIndentGuide.activeBackground1": "#ffffff18"
            }
        });

        monaco.editor.defineTheme("zs-code-light", {
            base: "vs",
            inherit: true,
            semanticHighlighting: true,
            rules: [
                { token: "comment", foreground: "008000" },
                { token: "keyword", foreground: "AF00DB" },
                { token: "string", foreground: "A31515" },
                { token: "number", foreground: "098658" },
                { token: "type", foreground: "267F99" },
                { token: "type.identifier", foreground: "267F99" },
                { token: "function", foreground: "795E26" },
                { token: "function.declaration", foreground: "795E26" },
                { token: "tag", foreground: "800000" },
                { token: "delimiter.tag", foreground: "808080" },
                { token: "attribute.name", foreground: "001080" },
                { token: "operator", foreground: "000000" }
            ],
            colors: {
                "editor.background": "#ffffff",
                "editor.foreground": "#1f2937",
                "editorLineNumber.foreground": "#94a3b8",
                "editorLineNumber.activeForeground": "#334155",
                "editorCursor.foreground": "#1227b2",
                "editor.lineHighlightBackground": "#00000005",
                "editor.selectionBackground": "#add6ff"
            }
        });
    };

    const updateCursorState = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const position = editor.getPosition();
        const selection = editor.getSelection();

        if (position) {
            setCursorPosition({
                line: position.lineNumber,
                column: position.column
            });
        }

        if (selection && !selection.isEmpty()) {
            const model = editor.getModel();

            if (model) {
                const text = model.getValueInRange(selection);

                setSelectionInfo({
                    chars: text.length,
                    lines: text.split("\n").length
                });
            }
        } else {
            setSelectionInfo({ chars: 0, lines: 0 });
        }
    };

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        editor.addAction({
            id: "zs-code-save",
            label: "Save File",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => {
                if (activeFile && editorRef.current) {
                    const id = activeFile._id || activeFile.id;
                    scheduleSave(id, editorRef.current.getValue());
                }
                return null;
            }
        });

        editor.onDidChangeCursorPosition(updateCursorState);
        editor.onDidChangeCursorSelection(updateCursorState);
        updateCursorState();

        markerListenerRef.current = monaco.editor.onDidChangeMarkers(resources => {
            const model = editor.getModel();
            if (!model) return;

            const uri = model.uri.toString();

            if (!resources.some(resource => resource.toString() === uri)) return;

            setMarkers(
                monaco.editor.getModelMarkers({ resource: model.uri })
            );
        });

        setMarkers(
            monaco.editor.getModelMarkers({
                resource: editor.getModel()?.uri
            }) || []
        );

        editor.focus();
    };

    useEffect(() => () => markerListenerRef.current?.dispose(), []);

    useEffect(() => {
        setProblemsOpen(false);
        setMarkers([]);
        setEncodingOpen(false);
        setIndentationOpen(false);
        setLanguageOpen(false);
    }, [fileId]);

    const goToLine = () => {
        setProblemsOpen(false);
        runEditorAction("editor.action.gotoLine");
    };

    const changeIndentation = (spaces, size) => {
        const editor = editorRef.current;
        if (!editor) return;

        setIndentation({ spaces, size });

        editor.updateOptions({
            tabSize: size,
            insertSpaces: spaces,
            detectIndentation: false
        });

        setIndentationOpen(false);
        editor.focus();
    };

    const changeLineEnding = ending => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!model) return;

        model.pushEOL(ending === "CRLF" ? 1 : 0);
        setLineEnding(ending);
        editor.focus();
    };

    const changeLanguage = nextLanguage => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor?.getModel();

        if (!editor || !monaco || !model) return;

        monaco.editor.setModelLanguage(model, nextLanguage);
        setLanguageOpen(false);
        editor.focus();
    };

    const openProblem = marker => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.setPosition({
            lineNumber: marker.startLineNumber,
            column: marker.startColumn
        });

        editor.revealPositionInCenter({
            lineNumber: marker.startLineNumber,
            column: marker.startColumn
        });

        editor.focus();
        setProblemsOpen(false);
    };

    const saveStatus = {
        saved: "Saved",
        saving: "Saving...",
        unsaved: "Unsaved",
        error: "Save failed"
    }[saveState];

    if (!activeFile) {
        return (
            <div className={`flex h-full w-full items-center justify-center ${
                isDark ? "bg-[#0d1117] text-white/30" : "bg-white text-slate-400"
            }`}>
                <div className="text-center">
                    <FaCode className="mx-auto mb-4 text-6xl opacity-70" />
                    <p className="text-xl font-plex">Open a file to start coding</p>
                    <p className="mt-1 text-[15px] opacity-60 font-plex">
                        Your opened files will appear in the tabs above.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative flex h-full w-full flex-col ${
                isDark ? "bg-[#0d1117]" : "bg-white"
            }`}
            onContextMenu={openContextMenu}
        >
            {/* Save indicator */}
            <div className={`absolute right-3 top-2 z-20 flex items-center gap-2 rounded-md border px-2 py-1 font-plex text-[13px] tracking-widest ${
                isDark
                    ? "border-white/10 bg-[#111827]/80 text-white"
                    : "border-black/10 bg-white/90 text-blue-800"
            }`}>
                {saveState === "saved" && <FaCheck className="text-[10px] text-green-400" />}
                {saveState === "unsaved" && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />}
                {saveState === "error" && <FaExclamationTriangle className="text-[10px] text-red-400" />}
                <span>{saveStatus}</span>
            </div>

            {/* Monaco */}
            <div className="min-h-0 flex-1">
                <MonacoEditor
                    height="100%"
                    width="100%"
                    path={`zs-code/${fileId}`}
                    language={language}
                    defaultValue={activeFile.content || ""}
                    theme={isDark ? "zs-code-dark" : "zs-code-light"}
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorMount}
                    onChange={value => {
                        const nextValue = value ?? "";
                        const id = activeFile._id || activeFile.id;

                        updateOpenFile(id, { content: nextValue });
                        scheduleSave(id, nextValue);
                    }}
                    options={{
                        automaticLayout: true,
                        semanticHighlighting: true,
                        contextmenu: false,
                        fontFamily: "Consolas, 'Cascadia Code', 'Fira Code', monospace",
                        fontSize: 14,
                        fontLigatures: true,
                        lineHeight: 21,
                        minimap: { enabled: true, scale: 1 },
                        padding: { top: 10, bottom: 10 },
                        renderWhitespace: "selection",
                        renderLineHighlight: "all",
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true, indentation: true },
                        folding: true,
                        foldingHighlight: true,
                        showFoldingControls: "mouseover",
                        matchBrackets: "always",
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        parameterHints: { enabled: true },
                        tabCompletion: "on",
                        tabSize: indentation.size,
                        insertSpaces: indentation.spaces,
                        detectIndentation: true,
                        autoIndent: "full",
                        autoClosingBrackets: "always",
                        autoClosingQuotes: "always",
                        wordWrap: "off",
                        stickyScroll: { enabled: true },
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                            useShadows: false
                        }
                    }}
                />
            </div>

            {/* Problems */}
            {problemsOpen && (
                <div
                    className={`absolute bottom-[25px] left-2 z-50 w-[390px] max-h-[330px] overflow-hidden rounded-lg border backdrop-blur-xl ${
                        isDark
                            ? "border-white/10 bg-[#111827]/98 text-white"
                            : "border-black/10 bg-white/98 text-slate-800"
                    }`}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className={`flex h-9 items-center justify-between border-b px-3 text-[12px] font-semibold ${
                        isDark ? "border-white/10" : "border-black/10"
                    }`}>
                        <div className="flex items-center gap-2">
                            <FaExclamationCircle className="text-red-400" />
                            <span>Problems</span>
                            <span className="opacity-40">{markers.length}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setProblemsOpen(false)}
                            className="rounded p-1 opacity-50 hover:bg-white/10 hover:opacity-100"
                        >
                            <FiX />
                        </button>
                    </div>

                    <div className="max-h-[290px] overflow-y-auto">
                        {markers.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-10 text-center ${
                                isDark ? "text-white/35" : "text-slate-400"
                            }`}>
                                <FiInfo className="mb-2 text-xl" />
                                <span className="text-xs">No problems detected</span>
                            </div>
                        ) : (
                            markers.map((marker, index) => {
                                const isError = marker.severity === 8;

                                return (
                                    <button
                                        type="button"
                                        key={`${marker.startLineNumber}-${marker.startColumn}-${index}`}
                                        onClick={() => openProblem(marker)}
                                        className={`flex w-full gap-3 border-b px-3 py-2 text-left transition ${
                                            isDark
                                                ? "border-white/5 hover:bg-white/[0.04]"
                                                : "border-black/5 hover:bg-black/[0.03]"
                                        }`}
                                    >
                                        <div className="pt-0.5">
                                            {isError
                                                ? <FaExclamationCircle className="text-red-400" />
                                                : <FaExclamationTriangle className="text-yellow-400" />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[11px] font-medium">
                                                {marker.message}
                                            </div>

                                            <div className={`mt-0.5 text-[10px] ${
                                                isDark ? "text-white/35" : "text-slate-400"
                                            }`}>
                                                Line {marker.startLineNumber}, Column {marker.startColumn}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* FootBar */}
            <div className={`relative z-40 flex h-[30px] shrink-0 items-center justify-between border-t select-none font-plex ${
                isDark
                    ? "border-white/10 bg-[#111827] text-white"
                    : "border-black/10 bg-[#f7f8fa] text-slate-700"
            }`}>
                {/* Left */}
                <div className="flex h-full min-w-0 items-center">
                    <StatusButton
                        isDark={isDark}
                        active={problemsOpen}
                        title="Show Problems"
                        onClick={() => setProblemsOpen(v => !v)}
                    >
                        <FaExclamationCircle className={errorCount ? "text-red-400" : "opacity-50"} />
                        <span>{errorCount}</span>
                        <FaExclamationTriangle className={`ml-1 ${warningCount ? "text-yellow-400" : "opacity-40"}`} />
                        <span>{warningCount}</span>
                    </StatusButton>

                    <StatusButton
                        isDark={isDark}
                        title="Problems"
                        onClick={() => setProblemsOpen(true)}
                    >
                        <FiInfo />
                        <span>
                            {markers.length === 0
                                ? "No problems"
                                : `${markers.length} problem${markers.length > 1 ? "s" : ""}`}
                        </span>
                    </StatusButton>

                    <StatusButton
                        isDark={isDark}
                        title="Source Control"
                        onClick={() => window.dispatchEvent(
                            new CustomEvent("zs-code-open-source-control")
                        )}
                    >
                        <FiGitBranch />
                        <span>main</span>
                    </StatusButton>
                </div>

                {/* Right */}
                <div className="flex h-full min-w-0 items-center">
                    <StatusButton
                        isDark={isDark}
                        title="Go to Line"
                        onClick={goToLine}
                    >
                        Ln {cursorPosition.line}, Col {cursorPosition.column}
                    </StatusButton>

                    {selectionInfo.chars > 0 && (
                        <StatusButton isDark={isDark} title="Selection">
                            {selectionInfo.chars} selected
                        </StatusButton>
                    )}

                    {/* Indentation */}
                    <div className="relative h-full">
                        <StatusButton
                            isDark={isDark}
                            active={indentationOpen}
                            title="Indentation"
                            onClick={() => {
                                setIndentationOpen(v => !v);
                                setEncodingOpen(false);
                                setLanguageOpen(false);
                            }}
                        >
                            {indentation.spaces ? "Spaces" : "Tabs"}: {indentation.size}
                            <FiChevronDown className="text-[9px] opacity-50" />
                        </StatusButton>

                        {indentationOpen && (
                            <div className={`absolute bottom-[27px] right-0 z-50 w-[190px] overflow-hidden rounded-lg border py-1 backdrop-blur-xl ${
                                isDark
                                    ? "border-white/10 bg-[#151b2a] text-white"
                                    : "border-black/10 bg-white text-slate-800"
                            }`}>
                                {[
                                    [true, 2, "Spaces: 2"],
                                    [true, 4, "Spaces: 4"],
                                    [false, 2, "Tabs: 2"],
                                    [false, 4, "Tabs: 4"]
                                ].map(([spaces, size, label]) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => changeIndentation(spaces, size)}
                                        className="w-full px-3 py-2 text-left text-[11px] hover:bg-white/10"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Encoding */}
                    <div className="relative h-full">
                        <StatusButton
                            isDark={isDark}
                            active={encodingOpen}
                            title="File Encoding"
                            onClick={() => {
                                setEncodingOpen(v => !v);
                                setIndentationOpen(false);
                                setLanguageOpen(false);
                            }}
                        >
                            UTF-8
                            <FiChevronDown className="text-[9px] opacity-50" />
                        </StatusButton>

                        {encodingOpen && (
                            <div className={`absolute bottom-[27px] right-0 z-50 w-[170px] overflow-hidden rounded-lg border py-1 backdrop-blur-xl ${
                                isDark
                                    ? "border-white/10 bg-[#151b2a] text-white"
                                    : "border-black/10 bg-white text-slate-800"
                            }`}>
                                <div className={`px-3 py-2 text-[10px] uppercase tracking-wider ${
                                    isDark ? "text-white/35" : "text-slate-400"
                                }`}>
                                    Encoding
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEncodingOpen(false)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-white/10"
                                >
                                    UTF-8
                                    <FaCheck className="text-[9px] text-cyan-400" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Line ending */}
                    <StatusButton
                        isDark={isDark}
                        title={`Line Ending: ${lineEnding}`}
                        onClick={() => changeLineEnding(lineEnding === "LF" ? "CRLF" : "LF")}
                    >
                        {lineEnding}
                    </StatusButton>

                    {/* Language */}
                    <div className="relative h-full">
                        <StatusButton
                            isDark={isDark}
                            active={languageOpen}
                            title="Select Language Mode"
                            onClick={() => {
                                setLanguageOpen(v => !v);
                                setEncodingOpen(false);
                                setIndentationOpen(false);
                            }}
                        >
                            <FaFileCode className="text-[10px]" />
                            {languageDisplay}
                            <FiChevronDown className="text-[9px] opacity-50" />
                        </StatusButton>

                        {languageOpen && (
                            <div className={`absolute bottom-[27px] right-0 z-50 max-h-[330px] w-[220px] overflow-y-auto rounded-lg border py-1 backdrop-blur-xl ${
                                isDark
                                    ? "border-white/10 bg-[#151b2a] text-white"
                                    : "border-black/10 bg-white text-slate-800"
                            }`}>
                                {Object.entries(languageNames).map(([lang, name]) => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => changeLanguage(lang)}
                                        className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] ${
                                            language === lang
                                                ? isDark
                                                    ? "bg-purple-500/10 text-purple-300"
                                                    : "bg-blue-500/10 text-blue-700"
                                                : isDark
                                                    ? "hover:bg-white/10"
                                                    : "hover:bg-black/5"
                                        }`}
                                    >
                                        {name}
                                        {language === lang && <FaCheck className="text-[9px]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save */}
                    <StatusButton isDark={isDark} title={saveStatus}>
                        {saveState === "saved" && <FaCheck className="text-green-400" />}
                        {saveState === "saving" && <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />}
                        {saveState === "unsaved" && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
                        {saveState === "error" && <FaExclamationCircle className="text-red-400" />}
                    </StatusButton>
                </div>
            </div>

            {/* Context menu */}
            {contextMenu && (
                <div
                    className={`fixed z-[999999] w-[220px] overflow-hidden rounded-md border py-1 shadow-2xl backdrop-blur-xl ${
                        isDark
                            ? "border-gray-700 bg-[#181818]/98 text-gray-200"
                            : "border-gray-300 bg-white/98 text-gray-800"
                    }`}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onMouseDown={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    <MenuItem icon={FaUndo} label="Undo" onClick={() => runEditorAction("undo")} shortcut="Ctrl+Z" />
                    <MenuItem icon={FaRedo} label="Redo" onClick={() => runEditorAction("redo")} shortcut="Ctrl+Y" />

                    <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                    <MenuItem
                        icon={FaCut}
                        label="Cut"
                        onClick={cutSelection}
                        disabled={!contextMenu.hasSelection}
                        shortcut="Ctrl+X"
                    />

                    <MenuItem
                        icon={FaCopy}
                        label="Copy"
                        onClick={copySelection}
                        disabled={!contextMenu.hasSelection}
                        shortcut="Ctrl+C"
                    />

                    <MenuItem
                        icon={FaClipboard}
                        label="Paste"
                        onClick={pasteClipboard}
                        shortcut="Ctrl+V"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Select All"
                        onClick={selectAll}
                        shortcut="Ctrl+A"
                    />

                    <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                    <MenuItem
                        icon={FaSearch}
                        label="Find"
                        onClick={() => runEditorAction("actions.find")}
                        shortcut="Ctrl+F"
                    />

                    <MenuItem
                        icon={FaSearch}
                        label="Replace"
                        onClick={() => runEditorAction("editor.action.startFindReplaceAction")}
                        shortcut="Ctrl+H"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Go to Line"
                        onClick={goToLine}
                        shortcut="Ctrl+G"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Format Document"
                        onClick={formatDocument}
                        shortcut="Shift+Alt+F"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Delete Line"
                        onClick={() => runEditorAction("editor.action.deleteLines")}
                        shortcut="Ctrl+Shift+K"
                    />

                    <MenuItem
                        icon={FaCopy}
                        label="Duplicate Line"
                        onClick={() => runEditorAction("editor.action.copyLinesDownAction")}
                    />
                </div>
            )}
        </div>
    );
};

export default Editor; 