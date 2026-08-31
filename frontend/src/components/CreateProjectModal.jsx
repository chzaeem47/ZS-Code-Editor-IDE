import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    FaFolderPlus,
    FaTimes,
} from "react-icons/fa";

const CreateProjectModal = ({
    isOpen,
    isDark,
    onClose,
    onCreate,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setDescription("");
            setCreating(false);
        }
    }, [isOpen]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const cleanName = name.trim();
        const cleanDescription = description.trim();

        if (!cleanName) {
            return;
        }

        setCreating(true);

        try {
            const success = await onCreate(
                cleanName,
                cleanDescription
            );

            if (success) {
                onClose();
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !creating
                        ) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                        }}
                        className={`w-full max-w-[460px] rounded-[28px] border p-5 effect-less ${
                            isDark
                                ? "border-white/10 bg-gradient-to-br from-[#0c1438]/98 via-[#101944]/98 to-[#190d2d]/98"
                                : "border-black/10 bg-white/95"
                        }`}
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                                        isDark
                                            ? "bg-cyan-400/10 text-cyan-300"
                                            : "bg-[#1227b2] text-white"
                                    }`}
                                >
                                    <FaFolderPlus size={20}/>
                                </div>

                                <div>
                                    <h2
                                        className={`font-serif text-xl font-bold ${
                                            isDark
                                                ? "text-white"
                                                : "text-slate-900"
                                        }`}
                                    >
                                        Create Project
                                    </h2>

                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={creating}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                                    isDark
                                        ? "text-white/50 hover:bg-white/10 hover:text-white"
                                        : "text-slate-400 hover:bg-black/5 hover:text-slate-700"
                                }`}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* FORM */}
                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 space-y-4"
                        >
                            {/* NAME */}
                            <div>
                                <label
                                    className={`mb-2 block font-serif text-sm font-semibold ${
                                        isDark
                                            ? "text-white/80"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Project Name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="My Awesome Project"
                                    maxLength={100}
                                    autoFocus
                                    required
                                    className={`h-12 w-full rounded-xl border bg-transparent px-4 font-serif text-sm outline-none transition-all duration-300 ${
                                        isDark
                                            ? "border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/60 focus:bg-white/5"
                                            : "border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-black/[0.02]"
                                    }`}
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label
                                    className={`mb-2 block font-serif text-sm font-semibold ${
                                        isDark
                                            ? "text-white/80"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="What is this project about?"
                                    maxLength={500}
                                    rows={4}
                                    className={`w-full resize-none rounded-xl border bg-transparent px-4 py-3 font-serif text-sm outline-none transition-all duration-300 ${
                                        isDark
                                            ? "border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/60 focus:bg-white/5"
                                            : "border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-black/[0.02]"
                                    }`}
                                />
                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={creating}
                                    className={`effect-less flex h-11 items-center justify-center rounded-full px-5 font-serif text-sm font-semibold ${
                                        isDark
                                            ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                                            : "border-black/10 bg-black/5 text-slate-700 hover:bg-black/10"
                                    }`}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        creating ||
                                        !name.trim()
                                    }
                                    className="effect-3d flex h-11 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#0b165d] via-[#1227b2]/80 to-[#0641e2] px-6 font-serif text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {creating
                                        ? "Creating..."
                                        : "Create Project"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateProjectModal;