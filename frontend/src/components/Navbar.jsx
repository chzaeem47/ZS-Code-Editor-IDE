import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaChevronDown, FaSun, FaMoon, FaSignOutAlt, FaFolder, FaHome, FaCode, FaDesktop, FaStar, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { logout } from "../features/logout";
import { logoutLocal } from "../redux/slices/authSlice";
import { useWorkspace } from "../context/WorkspaceContext";
import { createProject, deleteProject, getProjects, getStarredProject, toggleStar } from "../features/project";
import { createRootFolder } from "../features/file";
import { toast } from "react-toastify";
import CreateProjectModal from "./CreateProjectModal";

const Navbar = () => {
    const { isDark, toggleTheme } = useTheme();
    const { viewMode, setViewMode } = useWorkspace();
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [homeOpen, setHomeOpen] = useState(false);
    const [starOpen, setStarOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [starredProjects, setStarredProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [starredLoading, setStarredLoading] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const menuRef = useRef(null);
    const homeMenuRef = useRef(null);
    const starMenuRef = useRef(null);

    const fetchProjects = async () => {
        if (!user) return;
        setProjectsLoading(true);
        try {
            const result = await getProjects();
            setProjects(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Fetch projects error:", error);
            toast.error("Unable to load projects.");
        } finally {
            setProjectsLoading(false);
        }
    };

    const fetchStarredProjects = async () => {
        if (!user) return;
        setStarredLoading(true);
        try {
            const result = await getStarredProject();
            setStarredProjects(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Fetch starred projects error:", error);
            toast.error("Unable to load starred projects.");
        } finally {
            setStarredLoading(false);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
            if (homeMenuRef.current && !homeMenuRef.current.contains(event.target)) setHomeOpen(false);
            if (starMenuRef.current && !starMenuRef.current.contains(event.target)) setStarOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        const handleProjectsUpdated = () => {
            fetchProjects();
            fetchStarredProjects();
        };
        window.addEventListener("zs-code-projects-updated", handleProjectsUpdated);
        return () => window.removeEventListener("zs-code-projects-updated", handleProjectsUpdated);
    }, [user]);

    const getInitials = (name = "") => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    const getFirstName = (name = "") => name.trim().split(/\s+/)[0] || "User";

    const handleHomeClick = () => {
        setStarOpen(false);
        setHomeOpen((previous) => {
            const next = !previous;
            if (next && user) fetchProjects();
            return next;
        });
    };

    const handleStarClick = () => {
        setHomeOpen(false);
        setStarOpen((previous) => {
            const next = !previous;
            if (next && user) fetchStarredProjects();
            return next;
        });
    };

    const handleOpenProject = (project) => {
        if (!project?._id) return;
        window.dispatchEvent(new CustomEvent("zs-code-open-project", { detail: project }));
        setHomeOpen(false);
        setStarOpen(false);
        setSelectionMode(false);
        setSelectedProjects([]);
    };

    const handleSelection = (event, projectId) => {
        event.stopPropagation();
        setSelectedProjects((previous) => previous.includes(projectId) ? previous.filter((id) => id !== projectId) : [...previous, projectId]);
    };

    const handleCreateProject = async (name, description) => {
        try {
            const project = await createProject(name, description);
            if (!project) {
                toast.error("Project creation failed.");
                return false;
            }
            try {
                await createRootFolder(project._id, project.name);
            } catch (rootError) {
                console.error("Root folder creation failed:", rootError);
                await deleteProject(project._id);
                toast.error("Project created, but root folder could not be created.");
                return false;
            }
            setProjects((previous) => [project, ...previous.filter((item) => item._id !== project._id)]);
            toast.success(`"${project.name}" created successfully.`);
            window.dispatchEvent(new CustomEvent("zs-code-projects-updated"));
            return true;
        } catch (error) {
            console.error("Create project error:", error);
            toast.error(error?.response?.data?.message || "Unable to create project.");
            return false;
        }
    };

    const handleToggleStar = async (event, project) => {
        event.stopPropagation();
        const updatedProject = await toggleStar(project._id);
        if (!updatedProject) {
            toast.error("Unable to update project.");
            return;
        }
        setProjects((previous) => previous.map((item) => item._id === updatedProject._id ? updatedProject : item));
        setStarredProjects((previous) => updatedProject.starred ? [updatedProject, ...previous.filter((item) => item._id !== updatedProject._id)] : previous.filter((item) => item._id !== updatedProject._id));
        if (updatedProject.starred) toast.success(`"${updatedProject.name}" starred.`);
        else toast.info(`"${updatedProject.name}" removed from starred.`);
        window.dispatchEvent(new CustomEvent("zs-code-projects-updated"));
    };

    const handleDeleteSelected = async () => {
        if (!selectedProjects.length) {
            toast.info("Select at least one project.");
            return;
        }
        const confirmed = window.confirm(`Delete ${selectedProjects.length} selected project${selectedProjects.length > 1 ? "s" : ""}?`);
        if (!confirmed) return;
        try {
            const results = await Promise.all(selectedProjects.map((id) => deleteProject(id)));
            const successfulIds = selectedProjects.filter((id, index) => Boolean(results[index]));
            const failed = results.length - successfulIds.length;
            if (successfulIds.length) toast.success(`${successfulIds.length} project${successfulIds.length > 1 ? "s" : ""} deleted successfully.`);
            if (failed) toast.error(`${failed} project${failed > 1 ? "s" : ""} could not be deleted.`);
            setProjects((previous) => previous.filter((project) => !successfulIds.includes(project._id)));
            setStarredProjects((previous) => previous.filter((project) => !successfulIds.includes(project._id)));
            window.dispatchEvent(new CustomEvent("zs-code-projects-deleted", { detail: { projectIds: successfulIds } }));
            setSelectedProjects([]);
            setSelectionMode(false);
        } catch (error) {
            console.error("Delete selected projects error:", error);
            toast.error("Unable to delete selected projects.");
        }
    };

    const handleLogout = async () => {
        await logout();
        dispatch(logoutLocal());
        setOpen(false);
        setHomeOpen(false);
        setStarOpen(false);
        navigate("/");
    };

    const ProjectRow = ({ project, selectable = false }) => (
        <div onClick={() => !selectable && handleOpenProject(project)} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-200 ${selectable ? "" : "cursor-pointer"} ${isDark ? "hover:scale-[1.02]" : "hover:scale-[1.02]"}`}>
            {selectable && (
                <button type="button" onClick={(event) => handleSelection(event, project._id)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selectedProjects.includes(project._id) ? "border-[#1227b2] bg-[#1227b2] text-white" : isDark ? "border-white/20 bg-white/5" : "border-slate-300 bg-white"}`} aria-label={`Select ${project.name}`}>
                    {selectedProjects.includes(project._id) && <FaCheck className="text-[9px]" />}
                </button>
            )}
            <FaFolder className={`shrink-0 text-[17px] ${isDark ? "text-cyan-400" : "text-[#1227b2]"}`} />
            <div className="min-w-0 flex-1">
                <p className={`truncate font-serif text-[14px] font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{project.name}</p>
                {project.description && <p className={`truncate text-[10px] ${isDark ? "text-white/35" : "text-slate-500"}`}>{project.description}</p>}
            </div>
            <button type="button" onClick={(event) => handleToggleStar(event, project)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${project.starred ? "text-yellow-400" : isDark ? "text-white/20 hover:text-yellow-400" : "text-slate-300 hover:text-yellow-500"}`} aria-label={project.starred ? "Remove star" : "Star project"}>
                <FaStar className="text-[14px]" />
            </button>
        </div>
    );

    return (
        <>
            <nav className="fixed left-0 right-0 top-0 z-50">
                <div className={`mx-auto flex h-[50px] max-w-[1550px] items-center justify-between border-b px-4 transition-all duration-500 sm:px-5 ${isDark ? "border-white/10 bg-[#414040]" : "border-black/10 bg-white/70"}`}>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57] shadow-sm" />
                            <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e] shadow-sm" />
                            <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840] shadow-sm" />
                        </div>
                        <div className="mx-3 h-12 w-px bg-white/10" />

                        <div ref={homeMenuRef} className="relative">
                            <button type="button" onClick={handleHomeClick} className={`flex h-8 items-center gap-2 rounded-md border px-3 transition-all duration-200 ${homeOpen ? isDark ? "border-white/15 bg-white/[0.09] text-white" : "border-black/10 bg-black/[0.05] text-slate-800" : isDark ? "border-gray-300/10 bg-white/[0.04] text-white hover:bg-white/[0.07]" : "border-black/10 bg-white/[0.04] text-slate-700 hover:bg-black/[0.05]"}`}>
                                <FaHome className="text-[17px]" />
                                <FaChevronDown className={`text-[10px] transition-transform ${homeOpen ? "rotate-180" : ""}`} />
                            </button>

                            {homeOpen && (
                                <div className={`absolute left-0 top-[calc(100%+12px)] w-[310px] overflow-hidden rounded-[20px] p-2 effect-3d backdrop-blur-3xl ${isDark ? "bg-[#393636]" : "border-black/10 bg-gradient-to-b from-white/98 to-slate-100/98"}`}>

                                    <div className={`my-2 h-p`} />

                                    {!user ? (
                                        <div className={`px-3 py-8 text-center text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Sign in to view your projects.</div>
                                    ) : (
                                        <>
                                            <div className="mb-2 flex gap-2 px-1">
                                                <button type="button" onClick={() => setShowCreateModal(true)} className="effect-3d font-plex flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#0b165d] via-[#1227b2] to-[#0641e2] px-2 text-xl tracking-widest text-white">
                                                    Create
                                                </button>
                                                <button type="button" onClick={() => setSelectionMode((previous) => !previous)} className={`effect-3d font-plex flex h-9 items-center justify-center rounded-full px-4 text-xl tracking-widest text-white ${selectionMode ? "bg-rose-600" : "bg-gradient-to-r from-[#0b165d] via-[#1227b2] to-[#0641e2]"}`}>
                                                    {selectionMode ? "Cancel" : "Select"}
                                                </button>
                                            </div>

                                            <div className="max-h-[350px] space-y-1 overflow-hidden">
                                                {projectsLoading ? (
                                                    <div className={`px-3 py-8 text-center text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Loading projects...</div>
                                                ) : projects.length ? (
                                                    projects.map((project, index) => (
                                                        <div key={project._id} className={`mt-2 flex items-center gap-0 rounded-4xl px-2.5 py-0.5 ${isDark ? "bg-black/[0.5]" : "bg-black/[0.03]"}`}>
                                                            <span className={`w-5 text-center text-[14px] font-semibold font-plex ${isDark ? "text-white" : "text-slate-400"}`}>{index + 1} .</span>
                                                            <div className="min-w-0 flex-1">
                                                                <ProjectRow project={project} selectable={selectionMode} />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className={`px-3 py-8 text-center text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>No projects yet</div>
                                                )}
                                            </div>

                                            {selectionMode && (
                                                <button type="button" onClick={handleDeleteSelected} disabled={!selectedProjects.length} className="effect-3d font-plex text-[14px] mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                                                    <FaTrash className="text-[14px]" />
                                                    Delete Selected
                                                    {selectedProjects.length > 0 && ` (${selectedProjects.length})`}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div ref={starMenuRef} className="relative">
                            <button type="button" onClick={handleStarClick} aria-label="Starred Projects" className={`ml-1 flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-200 ${starOpen ? isDark ? "border-white/15 bg-white/[0.09] text-yellow-400" : "border-black/10 bg-black/[0.05] text-yellow-500" : isDark ? "border-gray-300/10 bg-white/[0.04] text-white/60 hover:text-yellow-400" : "border-black/10 bg-white/[0.04] text-slate-500 hover:text-yellow-500"}`}>
                                <FaStar className="text-[15px]" />
                            </button>

                            {starOpen && (
                                <div className={`absolute left-0 top-[calc(100%+12px)] w-[290px] overflow-hidden rounded-[20px] border p-2 effect-3d backdrop-blur-3xl ${isDark ? "border-white/10 bg-[#393636]" : "border-black/10 bg-gradient-to-b from-white/98 to-slate-100/98"}`}>
                                    <div className="flex items-center gap-2 px-2 py-1">
                                        <FaStar className="text-yellow-400" />
                                        <span className={`font-plex tracking-wider font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Starred Projects</span>
                                    </div>

                                    <div className={`my-2 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                                    {!user ? (
                                        <div className={`px-3 py-8 text-center text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Sign in to view your projects.</div>
                                    ) : (
                                        <div className="max-h-[350px] overflow-hidden">
                                            {starredLoading ? (
                                                <div className={`px-3 py-8 text-center text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Loading starred projects...</div>
                                            ) : starredProjects.length ? (
                                                starredProjects.map((project) => <ProjectRow key={project._id} project={project} />)
                                            ) : (
                                                <div className={`px-3 py-8 text-center text-[16px] font-plex ${isDark ? "text-white/40" : "text-slate-400"}`}>No starred projects yet</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="ml-2 flex items-center gap-3 p-0.5">
                            <button type="button" onClick={() => setViewMode("code")} className={`flex h-8 items-center gap-1.5 rounded-sm border border-purple-300/20 px-3 font-plex text-[17px] transition-all duration-300 ${viewMode === "code" ? isDark ? "bg-purple-800 text-white" : "bg-black/10 text-[#1227b2]" : isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-black/5 hover:text-slate-800"}`}>
                                <FaCode className="text-[17px]" />
                                Code
                            </button>
                            <button type="button" onClick={() => setViewMode("preview")} className={`flex h-8 items-center gap-1.5 rounded-sm border border-blue-200/20 px-2 font-plex text-[17px] transition-all duration-300 ${viewMode === "preview" ? isDark ? "bg-blue-800 text-white" : "bg-black/10 text-[#1227b2]" : isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-black/5 hover:text-slate-800"}`}>
                                <FaDesktop className="text-[17px]" />
                                Preview
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-10">
                        <button type="button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className={`group relative h-6 w-12 overflow-hidden rounded-[20px] border transition-all duration-500 ${isDark ? "border-gray-300/10 bg-white/10" : "bg-black/15"}`}>
                            <span className={`absolute top-0 flex h-full w-6 items-center justify-center rounded-[20px] transition-all duration-500 ${isDark ? "left-0 bg-[#3155ff]" : "left-6 bg-[#f5b83d] shadow-[0_0_12px_rgba(245,184,61,0.3)]"}`}>
                                {isDark ? <FaMoon className="text-[13px] text-white/90" /> : <FaSun className="text-[10px] text-black/80" />}
                            </span>
                        </button>

                        {!user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button type="button" onClick={() => navigate("/login")} className="flex h-11 items-center justify-center rounded-md bg-blue-700 effect-3d px-4 font-plex text-[22px] tracking-wide text-white transition-all duration-300 hover:scale-[1.03] sm:h-8 sm:px-3 sm:text-[19px]">Login</button>
                                <button type="button" onClick={() => navigate("/signup")} className="flex h-11 items-center justify-center rounded-md bg-purple-700 effect-3d px-4 font-plex text-[22px] tracking-wide text-white transition-all duration-300 hover:scale-[1.03] sm:h-8 sm:px-3 sm:text-[19px]">Sign Up</button>
                            </div>
                        ) : (
                            <div ref={menuRef} className="relative">
                                <button type="button" onClick={() => setOpen((previous) => !previous)} className={`font-plex flex h-11 items-center gap-2 rounded-md border px-1.5 py-1.5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] sm:h-10 sm:gap-2.5 sm:pl-1.5 sm:pr-3 ${isDark ? "border-white/20 bg-gradient-to-r from-[#0a1768] via-[#120bd1] to-[#0a1768]/90 text-white" : "border-indigo-200/80 bg-gradient-to-r from-[#0212f1] via-[#04bef1] to-[#0212f1] text-white"}`}>
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-[11px] font-bold sm:h-8 sm:w-8 sm:text-xs ${isDark ? "border-white/25 bg-white text-black" : "border-black/10 bg-black text-white"}`}>
                                        {user.avatar ? <img src={user.avatar} alt={user.name || "User"} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.textContent = getInitials(user.name); }} className="h-full w-full object-cover" /> : getInitials(user.name)}
                                    </div>
                                    <span className={`hidden max-w-[100px] truncate text-sm font-semibold sm:block ${isDark ? "text-white" : "text-black"}`}>{getFirstName(user.name)}</span>
                                    <FaChevronDown className={`mr-1 text-[10px] transition-transform ${open ? "rotate-180" : ""}`} />
                                </button>

                                {open && (
                                    <div className={`absolute right-0 top-[calc(100%+10px)] w-[300px] overflow-hidden rounded-xl p-2 border effect-less ${isDark ? "border-white/15 bg-[#393636]" : "border-indigo-100 bg-gradient-to-b from-[#f8fafc]/95 to-[#f1f5f9]/95"}`}>
                                        <div className={`rounded-xl border p-3.5 ${isDark ? "border-white/5 bg-gradient-to-br from-white/10 via-transparent to-transparent" : "border-indigo-200/50 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent"}`}>
                                            <p className={`text-[12px] font-bold font-plex tracking-[0.18em] ${isDark ? "text-white/50" : "text-blue-700"}`}>Signed In As</p>
                                            <p className={`font-plex mt-1 text-3xl tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>{user.name}</p>
                                            <p className={`font-plex mt-0.5 truncate text-[14px] tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
                                        </div>
                                        <button type="button" onClick={handleLogout} className={`font-tangerine text-[25px] font-bold mt-2 flex w-full items-center gap-2.5 rounded-[20px] px-23 py-1 text-2xl tracking-wider effect-3d transition-all duration-300 ${isDark ? "border-white/10 bg-gradient-to-r from-[#aa3030]/80 to-[#aa3030]/80 text-purple-200 hover:from-rose-500 hover:to-rose-600 hover:text-white" : "border-rose-200/60 bg-gradient-to-r from-rose-50/50 to-slate-100/50 text-rose-600 hover:from-rose-500 hover:to-rose-600 hover:text-white"}`}>
                                            <FaSignOutAlt className="text-[18px]" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <CreateProjectModal isOpen={showCreateModal} isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={handleCreateProject} />
        </>
    );
};

export default Navbar;