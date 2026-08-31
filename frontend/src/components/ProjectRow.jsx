import {
    FaCheck,
    FaFolder,
    FaStar,
} from "react-icons/fa";

const ProjectRow = ({
    project,
    isDark,
    selectionMode,
    selected,
    onSelect,
    onToggleStar,
}) => {
    return (
        <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                selected
                    ? isDark
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-blue-300 bg-blue-50"
                    : isDark
                        ? "border-white/5 bg-white/[0.025] hover:bg-white/[0.07]"
                        : "border-black/5 bg-black/[0.02] hover:bg-black/[0.05]"
            }`}
        >
            {/* CHECKBOX */}
            {selectionMode && (
                <button
                    type="button"
                    onClick={() => onSelect(project._id)}
                    aria-label={`Select ${project.name}`}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
                        selected
                            ? "border-[#1227b2] bg-[#1227b2] text-white"
                            : isDark
                                ? "border-white/25 bg-white/5"
                                : "border-slate-300 bg-white"
                    }`}
                >
                    {selected && (
                        <FaCheck className="text-[9px]" />
                    )}
                </button>
            )}

            {/* FOLDER */}
            <FaFolder
                className={`shrink-0 text-[18px] ${
                    isDark
                        ? "text-cyan-400"
                        : "text-[#1227b2]"
                }`}
            />

            {/* PROJECT DETAILS */}
            <div className="min-w-0 flex-1">
                <p
                    className={`truncate font-serif text-sm font-semibold ${
                        isDark
                            ? "text-white"
                            : "text-slate-800"
                    }`}
                >
                    {project.name}
                </p>

                {project.description && (
                    <p
                        className={`mt-0.5 truncate text-[11px] ${
                            isDark
                                ? "text-white/40"
                                : "text-slate-500"
                        }`}
                    >
                        {project.description}
                    </p>
                )}
            </div>

            {/* STAR */}
            <button
                type="button"
                onClick={() =>
                    onToggleStar(project._id)
                }
                aria-label={
                    project.starred
                        ? "Remove star"
                        : "Star project"
                }
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                    project.starred
                        ? "text-yellow-400"
                        : isDark
                            ? "text-white/25 hover:text-yellow-400"
                            : "text-slate-300 hover:text-yellow-500"
                }`}
            >
                <FaStar className="text-[18px]" />
            </button>
        </div>
    );
};

export default ProjectRow;