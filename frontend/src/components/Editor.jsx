import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import MonacoEditor from "@monaco-editor/react";

import {
    FaCheck,
    FaClipboard,
    FaCode,
    FaCopy,
    FaCut,
    FaRedo,
    FaSearch,
    FaUndo,
} from "react-icons/fa";

import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { updateFile } from "../features/file";

const getLanguage = (file) => {
    const name = (
        file?.name || ""
    ).toLowerCase();

    const extension = (
        file?.extension ||
        name.split(".").pop() ||
        ""
    ).toLowerCase();

    if (
        name === "dockerfile" ||
        name.startsWith("dockerfile.")
    ) {
        return "dockerfile";
    }

    if (
        name === ".gitignore" ||
        name === ".gitattributes"
    ) {
        return "plaintext";
    }

    if (
        name === ".env" ||
        name.startsWith(".env.")
    ) {
        return "plaintext";
    }

    const languages = {
        js: "javascript",
        mjs: "javascript",
        cjs: "javascript",

        jsx: "javascriptreact",

        ts: "typescript",
        mts: "typescript",
        cts: "typescript",

        tsx: "typescriptreact",

        json: "json",
        jsonc: "json",

        css: "css",
        scss: "scss",
        sass: "scss",
        less: "less",

        html: "html",
        htm: "html",

        md: "markdown",
        mdx: "markdown",

        yaml: "yaml",
        yml: "yaml",

        xml: "xml",
        svg: "xml",

        py: "python",
        pyw: "python",

        php: "php",
        java: "java",

        c: "c",
        h: "cpp",

        cpp: "cpp",
        cc: "cpp",
        cxx: "cpp",
        hpp: "cpp",

        cs: "csharp",

        go: "go",
        rs: "rust",

        rb: "ruby",
        rake: "ruby",

        swift: "swift",

        kt: "kotlin",
        kts: "kotlin",

        dart: "dart",

        sh: "shell",
        bash: "shell",
        zsh: "shell",
        fish: "shell",

        ps1: "powershell",
        psm1: "powershell",
        psd1: "powershell",

        sql: "sql",

        vue: "html",
        svelte: "html",
        astro: "html",
    };

    return (
        languages[extension] ||
        "plaintext"
    );
};

const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    disabled = false,
    shortcut,
}) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[12px] transition-colors ${
                disabled
                    ? "cursor-not-allowed opacity-35"
                    : "hover:bg-white/10"
            }`}
        >
            <span className="flex w-4 shrink-0 items-center justify-center text-[11px]">
                <Icon />
            </span>

            <span className="flex-1">
                {label}
            </span>

            {shortcut && (
                <span className="text-[10px] opacity-40">
                    {shortcut}
                </span>
            )}
        </button>
    );
};

const Editor = () => {
    const { isDark } =
        useTheme();

    const {
        activeFile,
        updateOpenFile,
    } = useWorkspace();

    const editorRef =
        useRef(null);

    const saveTimersRef =
        useRef(new Map());

    const pendingContentRef =
        useRef(new Map());

    const savingFilesRef =
        useRef(new Set());

    const saveStatesRef =
        useRef(new Map());

    const [
        saveState,
        setSaveState,
    ] = useState("saved");

    const [
        contextMenu,
        setContextMenu,
    ] = useState(null);

    const fileId =
        activeFile?._id ||
        activeFile?.id;

    const setFileSaveState =
        useCallback(
            (id, state) => {
                if (!id) {
                    return;
                }

                saveStatesRef.current.set(
                    id,
                    state
                );

                if (id === fileId) {
                    setSaveState(
                        state
                    );
                }
            },
            [fileId]
        );

    const performSave =
        useCallback(
            async (id) => {
                if (!id) {
                    return;
                }

                if (
                    savingFilesRef.current.has(
                        id
                    )
                ) {
                    return;
                }

                const content =
                    pendingContentRef.current.get(
                        id
                    );

                if (
                    content === undefined
                ) {
                    return;
                }

                pendingContentRef.current.delete(
                    id
                );

                savingFilesRef.current.add(
                    id
                );

                setFileSaveState(
                    id,
                    "saving"
                );

                try {
                    await updateFile(
                        id,
                        {
                            content,
                        }
                    );

                    setFileSaveState(
                        id,
                        "saved"
                    );
                } catch (
                    error
                ) {
                    console.error(
                        "Auto-save failed:",
                        error
                    );

                    pendingContentRef.current.set(
                        id,
                        content
                    );

                    setFileSaveState(
                        id,
                        "error"
                    );
                } finally {
                    savingFilesRef.current.delete(
                        id
                    );

                    if (
                        pendingContentRef.current.has(
                            id
                        )
                    ) {
                        const existingTimer =
                            saveTimersRef.current.get(
                                id
                            );

                        if (existingTimer) {
                            clearTimeout(
                                existingTimer
                            );
                        }

                        const timer =
                            setTimeout(
                                () => {
                                    saveTimersRef.current.delete(
                                        id
                                    );

                                    performSave(
                                        id
                                    );
                                },
                                350
                            );

                        saveTimersRef.current.set(
                            id,
                            timer
                        );
                    }
                }
            },
            [
                setFileSaveState,
            ]
        );

    const scheduleSave =
        useCallback(
            (id, content) => {
                if (!id) {
                    return;
                }

                pendingContentRef.current.set(
                    id,
                    content
                );

                setFileSaveState(
                    id,
                    "unsaved"
                );

                const existingTimer =
                    saveTimersRef.current.get(
                        id
                    );

                if (existingTimer) {
                    clearTimeout(
                        existingTimer
                    );
                }

                const timer =
                    setTimeout(
                        () => {
                            saveTimersRef.current.delete(
                                id
                            );

                            performSave(
                                id
                            );
                        },
                        800
                    );

                saveTimersRef.current.set(
                    id,
                    timer
                );
            },
            [
                performSave,
                setFileSaveState,
            ]
        );

    useEffect(() => {
        if (!fileId) {
            return;
        }

        setSaveState(
            saveStatesRef.current.get(
                fileId
            ) || "saved"
        );
    }, [fileId]);

    useEffect(() => {
        return () => {
            for (
                const timer of
                    saveTimersRef.current.values()
            ) {
                clearTimeout(
                    timer
                );
            }
        };
    }, []);

    const runEditorAction =
        async (actionId) => {
            const action =
                editorRef.current?.getAction(
                    actionId
                );

            if (action) {
                await action.run();
            }

            editorRef.current?.focus();
        };

    const formatDocument =
        async () => {
            await runEditorAction(
                "editor.action.formatDocument"
            );
        };

    const copySelection =
        async () => {
            const editor =
                editorRef.current;

            if (!editor) {
                return;
            }

            const selection =
                editor.getSelection();

            if (
                !selection ||
                selection.isEmpty()
            ) {
                return;
            }

            const model =
                editor.getModel();

            const selectedText =
                model.getValueInRange(
                    selection
                );

            try {
                await navigator.clipboard.writeText(
                    selectedText
                );

                editor.focus();
            } catch (
                error
            ) {
                console.error(
                    "Copy failed:",
                    error
                );
            }
        };

    const cutSelection =
        async () => {
            const editor =
                editorRef.current;

            if (!editor) {
                return;
            }

            const selection =
                editor.getSelection();

            if (
                !selection ||
                selection.isEmpty()
            ) {
                return;
            }

            const model =
                editor.getModel();

            const selectedText =
                model.getValueInRange(
                    selection
                );

            try {
                await navigator.clipboard.writeText(
                    selectedText
                );

                editor.executeEdits(
                    "zs-code-cut",
                    [
                        {
                            range:
                                selection,
                            text: "",
                            forceMoveMarkers:
                                true,
                        },
                    ]
                );

                editor.focus();
            } catch (
                error
            ) {
                console.error(
                    "Cut failed:",
                    error
                );
            }
        };

    const pasteClipboard =
        async () => {
            const editor =
                editorRef.current;

            if (!editor) {
                return;
            }

            try {
                const text =
                    await navigator.clipboard.readText();

                const selection =
                    editor.getSelection();

                if (!selection) {
                    return;
                }

                editor.executeEdits(
                    "zs-code-paste",
                    [
                        {
                            range:
                                selection,
                            text,
                            forceMoveMarkers:
                                true,
                        },
                    ]
                );

                editor.focus();
            } catch (
                error
            ) {
                console.error(
                    "Paste failed:",
                    error
                );
            }
        };

    const selectAll =
        () => {
            const editor =
                editorRef.current;

            const model =
                editor?.getModel();

            if (
                !editor ||
                !model
            ) {
                return;
            }

            editor.setSelection(
                model.getFullModelRange()
            );

            editor.focus();
        };

    const openContextMenu =
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            const editor =
                editorRef.current;

            const selection =
                editor?.getSelection();

            const hasSelection =
                !!selection &&
                !selection.isEmpty();

            const menuWidth =
                220;

            const menuHeight =
                405;

            const padding =
                8;

            setContextMenu({
                x: Math.max(
                    padding,
                    Math.min(
                        event.clientX,
                        window.innerWidth -
                            menuWidth -
                            padding
                    )
                ),
                y: Math.max(
                    padding,
                    Math.min(
                        event.clientY,
                        window.innerHeight -
                            menuHeight -
                            padding
                    )
                ),
                hasSelection,
            });
        };

    useEffect(() => {
        const close = () => {
            setContextMenu(
                null
            );
        };

        document.addEventListener(
            "mousedown",
            close
        );

        window.addEventListener(
            "resize",
            close
        );

        window.addEventListener(
            "scroll",
            close,
            true
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                close
            );

            window.removeEventListener(
                "resize",
                close
            );

            window.removeEventListener(
                "scroll",
                close,
                true
            );
        };
    }, []);

    /*
     * IMPORTANT:
     *
     * Monaco themes are registered BEFORE
     * Monaco creates the editor.
     *
     * This prevents the editor from first
     * appearing with Monaco's default white
     * background in dark mode.
     */
    const handleBeforeMount =
        (monaco) => {
            monaco.editor.defineTheme(
                "zs-code-dark",
                {
                    base: "vs-dark",
                    inherit: true,
                    semanticHighlighting: true,

                    rules: [
                        // Comments
                        {
                            token:
                                "comment",
                            foreground:
                                "6A9955",
                        },

                        // Keywords: const, let, if, return, async, await, etc.
                        {
                            token:
                                "keyword",
                            foreground:
                                "C586C0",
                        },

                        // Strings: "hello", 'hello', `hello`
                        {
                            token:
                                "string",
                            foreground:
                                "CE9178",
                        },

                        // Numbers
                        {
                            token:
                                "number",
                            foreground:
                                "B5CEA8",
                        },

                        // Types
                        {
                            token:
                                "type",
                            foreground:
                                "4EC9B0",
                        },

                        {
                            token:
                                "type.identifier",
                            foreground:
                                "4EC9B0",
                        },

                        // Function names
                        {
                            token:
                                "function",
                            foreground:
                                "DCDCAA",
                        },

                        {
                            token:
                                "function.declaration",
                            foreground:
                                "DCDCAA",
                        },

                        // JSX tags
                        {
                            token:
                                "tag",
                            foreground:
                                "569CD6",
                        },

                        {
                            token:
                                "delimiter.tag",
                            foreground:
                                "808080",
                        },

                        // JSX attributes such as className, onClick
                        {
                            token:
                                "attribute.name",
                            foreground:
                                "9CDCFE",
                        },

                        // Operators
                        {
                            token:
                                "operator",
                            foreground:
                                "D4D4D4",
                        },
                    ],

                    colors: {
                        "editor.background":
                            "#0d1117",

                        "editor.foreground":
                            "#D4D4D4",

                        "editorLineNumber.foreground":
                            "#4b5563",

                        "editorLineNumber.activeForeground":
                            "#cbd5e1",

                        "editorCursor.foreground":
                            "#22d3ee",

                        "editor.lineHighlightBackground":
                            "#ffffff08",

                        "editor.selectionBackground":
                            "#264f78",

                        "editor.inactiveSelectionBackground":
                            "#264f7855",

                        "editorIndentGuide.background1":
                            "#ffffff0a",

                        "editorIndentGuide.activeBackground1":
                            "#ffffff18",
                    },
                }
            );

            monaco.editor.defineTheme(
                "zs-code-light",
                {
                    base: "vs",
                    inherit: true,
                    semanticHighlighting: true,

                    rules: [
                        {
                            token:
                                "comment",
                            foreground:
                                "008000",
                        },
                        {
                            token:
                                "keyword",
                            foreground:
                                "AF00DB",
                        },
                        {
                            token:
                                "string",
                            foreground:
                                "A31515",
                        },
                        {
                            token:
                                "number",
                            foreground:
                                "098658",
                        },
                        {
                            token:
                                "type",
                            foreground:
                                "267F99",
                        },
                        {
                            token:
                                "type.identifier",
                            foreground:
                                "267F99",
                        },
                        {
                            token:
                                "function",
                            foreground:
                                "795E26",
                        },
                        {
                            token:
                                "function.declaration",
                            foreground:
                                "795E26",
                        },
                        {
                            token:
                                "tag",
                            foreground:
                                "800000",
                        },
                        {
                            token:
                                "delimiter.tag",
                            foreground:
                                "808080",
                        },
                        {
                            token:
                                "attribute.name",
                            foreground:
                                "001080",
                        },
                        {
                            token:
                                "operator",
                            foreground:
                                "000000",
                        },
                    ],

                    colors: {
                        "editor.background":
                            "#ffffff",

                        "editor.foreground":
                            "#1f2937",

                        "editorLineNumber.foreground":
                            "#94a3b8",

                        "editorLineNumber.activeForeground":
                            "#334155",

                        "editorCursor.foreground":
                            "#1227b2",

                        "editor.lineHighlightBackground":
                            "#00000005",

                        "editor.selectionBackground":
                            "#add6ff",
                    },
                }
            );
        };

    const handleEditorMount =
        (editor, monaco) => {
            editorRef.current =
                editor;

            editor.addAction({
                id:
                    "zs-code-save",

                label:
                    "Save File",

                keybindings: [
                    monaco.KeyMod
                        .CtrlCmd |
                        monaco.KeyCode
                            .KeyS,
                ],

                run: () => {
                    if (
                        activeFile &&
                        editorRef.current
                    ) {
                        const id =
                            activeFile._id ||
                            activeFile.id;

                        scheduleSave(
                            id,
                            editorRef.current.getValue()
                        );
                    }

                    return null;
                },
            });

            editor.focus();
        };

    const saveStatus = {
        saved: "Saved",
        saving: "Saving...",
        unsaved:
            "Unsaved changes",
        error:
            "Save failed — retrying",
    }[saveState];

    if (!activeFile) {
        return (
            <div
                className={`flex h-full w-full items-center justify-center ${
                    isDark
                        ? "bg-[#0d1117] text-white/30"
                        : "bg-white text-slate-400"
                }`}
            >
                <div className="text-center">
                    <FaCode className="mx-auto mb-4 text-4xl opacity-40" />

                    <p className="text-sm">
                        Open a file to start coding
                    </p>

                    <p className="mt-1 text-xs opacity-60">
                        Your opened files will appear in the tabs above.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative h-full w-full  ${
                isDark
                    ? "bg-[#0d1117]"
                    : "bg-white"
            }`}
            onContextMenu={
                openContextMenu
            }
        >
            <div
                className={`absolute right-3 top-2 z-20 flex items-center gap-2 text-[12px] rounded-md border px-2 py-1 text-[10px] backdrop-blur-md ${
                    isDark
                        ? "border-white/10 bg-[#111827]/80 text-white"
                        : "border-black/10 bg-white/90 text-blue-800"
                }`}
            >
                {saveState ===
                    "saved" && (
                    <FaCheck className="text-[10px] text-green-500" />
                )}

                <span>
                    {saveStatus}
                </span>
            </div>

            <MonacoEditor
                height="100%"
                width="100%"
                path={`zs-code/${fileId}`}
                language={getLanguage(
                    activeFile
                )}
                defaultValue={
                    activeFile.content ||
                    ""
                }
                theme={
                    isDark
                        ? "zs-code-dark"
                        : "zs-code-light"
                }
                beforeMount={
                    handleBeforeMount
                }
                onMount={
                    handleEditorMount
                }
                onChange={(value) => {
                    const nextValue =
                        value ?? "";

                    const id =
                        activeFile._id ||
                        activeFile.id;

                    updateOpenFile(
                        id,
                        {
                            content:
                                nextValue,
                        }
                    );

                    scheduleSave(
                        id,
                        nextValue
                    );
                }}
                options={{
                    automaticLayout:
                        true,

                    semanticHighlighting: true,

                    contextmenu:
                        false,

                    fontFamily:
                        "Consolas, 'Cascadia Code', 'Fira Code', monospace",

                    fontSize:
                        14,

                    fontLigatures:
                        true,

                    lineHeight:
                        21,

                    minimap: {
                        enabled:
                            true,
                        scale: 1,
                    },

                    padding: {
                        top: 10,
                        bottom: 10,
                    },

                    renderWhitespace:
                        "selection",

                    renderLineHighlight:
                        "all",

                    scrollBeyondLastLine:
                        false,

                    smoothScrolling:
                        true,

                    cursorBlinking:
                        "smooth",

                    cursorSmoothCaretAnimation:
                        "on",

                    bracketPairColorization: {
                        enabled:
                            true,
                    },

                    guides: {
                        bracketPairs:
                            true,
                        indentation:
                            true,
                    },

                    folding: true,

                    foldingHighlight:
                        true,

                    showFoldingControls:
                        "mouseover",

                    matchBrackets:
                        "always",

                    suggestOnTriggerCharacters:
                        true,

                    quickSuggestions:
                        true,

                    parameterHints: {
                        enabled:
                            true,
                    },

                    tabCompletion:
                        "on",

                    tabSize: 2,

                    insertSpaces:
                        true,

                    detectIndentation:
                        true,

                    autoIndent:
                        "full",

                    autoClosingBrackets:
                        "always",

                    autoClosingQuotes:
                        "always",

                    wordWrap:
                        "off",

                    stickyScroll: {
                        enabled:
                            true,
                    },

                    overviewRulerBorder:
                        false,

                    hideCursorInOverviewRuler:
                        true,

                    scrollbar: {
                        verticalScrollbarSize:
                            10,

                        horizontalScrollbarSize:
                            10,

                        useShadows:
                            false,
                    },
                }}
            />

            {contextMenu && (
                <div
                    className={`fixed z-[999999] w-[220px] overflow-hidden rounded-md border py-1 shadow-2xl backdrop-blur-xl ${
                        isDark
                            ? "border-gray-700 bg-[#181818]/98 text-gray-200"
                            : "border-gray-300 bg-white/98 text-gray-800"
                    }`}
                    style={{
                        left:
                            contextMenu.x,

                        top:
                            contextMenu.y,
                    }}
                    onMouseDown={(
                        event
                    ) =>
                        event.stopPropagation()
                    }
                    onContextMenu={(
                        event
                    ) =>
                        event.preventDefault()
                    }
                >
                    <MenuItem
                        icon={FaUndo}
                        label="Undo"
                        onClick={() =>
                            runEditorAction(
                                "undo"
                            )
                        }
                        shortcut="Ctrl+Z"
                    />

                    <MenuItem
                        icon={FaRedo}
                        label="Redo"
                        onClick={() =>
                            runEditorAction(
                                "redo"
                            )
                        }
                        shortcut="Ctrl+Y"
                    />

                    <div
                        className={`my-1 h-px ${
                            isDark
                                ? "bg-white/10"
                                : "bg-black/10"
                        }`}
                    />

                    <MenuItem
                        icon={FaCut}
                        label="Cut"
                        onClick={
                            cutSelection
                        }
                        disabled={
                            !contextMenu.hasSelection
                        }
                        shortcut="Ctrl+X"
                    />

                    <MenuItem
                        icon={FaCopy}
                        label="Copy"
                        onClick={
                            copySelection
                        }
                        disabled={
                            !contextMenu.hasSelection
                        }
                        shortcut="Ctrl+C"
                    />

                    <MenuItem
                        icon={FaClipboard}
                        label="Paste"
                        onClick={
                            pasteClipboard
                        }
                        shortcut="Ctrl+V"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Select All"
                        onClick={
                            selectAll
                        }
                        shortcut="Ctrl+A"
                    />

                    <div
                        className={`my-1 h-px ${
                            isDark
                                ? "bg-white/10"
                                : "bg-black/10"
                        }`}
                    />

                    <MenuItem
                        icon={FaSearch}
                        label="Find"
                        onClick={() =>
                            runEditorAction(
                                "actions.find"
                            )
                        }
                        shortcut="Ctrl+F"
                    />

                    <MenuItem
                        icon={FaSearch}
                        label="Replace"
                        onClick={() =>
                            runEditorAction(
                                "editor.action.startFindReplaceAction"
                            )
                        }
                        shortcut="Ctrl+H"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Go to Line"
                        onClick={() =>
                            runEditorAction(
                                "editor.action.gotoLine"
                            )
                        }
                        shortcut="Ctrl+G"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Format Document"
                        onClick={
                            formatDocument
                        }
                        shortcut="Shift+Alt+F"
                    />

                    <MenuItem
                        icon={FaCode}
                        label="Delete Line"
                        onClick={() =>
                            runEditorAction(
                                "editor.action.deleteLines"
                            )
                        }
                        shortcut="Ctrl+Shift+K"
                    />

                    <MenuItem
                        icon={FaCopy}
                        label="Duplicate Line"
                        onClick={() =>
                            runEditorAction(
                                "editor.action.copyLinesDownAction"
                            )
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default Editor;