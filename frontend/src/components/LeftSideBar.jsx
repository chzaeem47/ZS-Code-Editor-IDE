import { useEffect,useState } from "react";
import { useTheme } from "../context/ThemeContext";
import FileExplorer from "./FileExplorer";

const LeftSideBar = () => {
    const { isDark } = useTheme();
    const [selectedProject,setSelectedProject] = useState(null);

    useEffect(() => {
        const handleOpenProject = (event) => {
            setSelectedProject(event.detail || null);
        };

        const handleDeletedProjects = (event) => {
            const ids = event.detail?.projectIds || [];
            setSelectedProject((previous) => previous && ids.includes(previous._id) ? null : previous);
        };

        window.addEventListener("zs-code-open-project",handleOpenProject);
        window.addEventListener("zs-code-projects-deleted",handleDeletedProjects);

        return () => {
            window.removeEventListener("zs-code-open-project",handleOpenProject);
            window.removeEventListener("zs-code-projects-deleted",handleDeletedProjects);
        };
    },[]);

    return (
        <aside className={`fixed left-0 top-12.5 bottom-0 z-40 w-[285px] overflow-hidden border ${isDark ? "border-gray-300/10 bg-[#181818] shadow-[0_20px_50px_rgba(0,0,0,0.18)]" : "border-black/10 bg-white/90 shadow-[0_20px_20px_rgba(0,0,0,0.18)]"}`}>
            <FileExplorer project={selectedProject}/>
        </aside>
    );
};

export default LeftSideBar;