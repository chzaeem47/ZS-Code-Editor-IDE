import { useCallback,useEffect,useState } from "react";
import { FaFolder,FaCode } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { getFile,getFileTree } from "../features/file";
import FileTree from "./FileTree";

const FileExplorer = ({ project }) => {
    const { isDark } = useTheme();
    const { openFile,clearOpenFiles } = useWorkspace();
    const [fileTree,setFileTree] = useState([]);
    const [treeLoading,setTreeLoading] = useState(false);

    const fetchFileTree = useCallback(async () => {
        if (!project?._id) {
            setFileTree([]);
            return;
        }

        setTreeLoading(true);

        try {
            const tree = await getFileTree(project._id);
            setFileTree(Array.isArray(tree) ? tree : []);
        } catch (error) {
            console.error("Fetch file tree error:",error);
            setFileTree([]);
            toast.error(error?.response?.data?.message || "Unable to load project files.");
        } finally {
            setTreeLoading(false);
        }
    },[project?._id]);

    useEffect(() => {
        clearOpenFiles();
        setFileTree([]);
        fetchFileTree();
    },[project?._id,fetchFileTree,clearOpenFiles]);

    const handleOpenFile = async (node) => {
        if (!node || node.type !== "file") return;

        try {
            const file = await getFile(node._id || node.id);
            if (file) openFile(file);
        } catch (error) {
            console.error("Open file error:",error);
            toast.error(error?.response?.data?.message || "Unable to open file.");
        }
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
           
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {!project ? (
                    <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                        <FaCode className={`mb-3 text-4xl ${isDark ? "text-white/20" : "text-slate-300"}`}/>
                        <p className={`font-plex tracking-wide text-[13px] ${isDark ? "text-white/40" : "text-slate-300"}`}>Select or create a project from Home to Open its Files</p>
                    </div>
                ) : treeLoading ? (
                    <div className={`px-2 py-4 text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Loading files...</div>
                ) : (
                    <FileTree tree={fileTree} projectId={project._id} isDark={isDark} onRefresh={fetchFileTree} onOpenFile={handleOpenFile}/>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;