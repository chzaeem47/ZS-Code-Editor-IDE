import { useCallback,useEffect,useRef,useState } from "react";
import { FaCode,FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { getFile,getFileTree } from "../features/file";
import FileTree from "./FileTree";

const FileExplorer=({project})=>{
    const {isDark}=useTheme();
    const {openFile,clearOpenFiles}=useWorkspace();

    const [fileTree,setFileTree]=useState([]);
    const [initialLoading,setInitialLoading]=useState(false);
    const [refreshing,setRefreshing]=useState(false);

    const previousProjectIdRef=useRef(null);
    const requestIdRef=useRef(0);
    const refreshTimerRef=useRef(null);

    const fetchFileTree=useCallback(async({initial=false}={})=>{
        const projectId=project?._id;

        if(!projectId){
            setFileTree([]);
            return;
        }

        const requestId=++requestIdRef.current;

        if(initial)setInitialLoading(true);
        else setRefreshing(true);

        try{
            const tree=await getFileTree(projectId);

            if(requestId!==requestIdRef.current)return;

            setFileTree(Array.isArray(tree)?tree:[]);
        }catch(error){
            if(requestId!==requestIdRef.current)return;

            console.error("Fetch file tree error:",error);

            toast.error(
                error?.response?.data?.message||
                "Unable to refresh project files."
            );
        }finally{
            if(requestId===requestIdRef.current){
                setInitialLoading(false);
                setRefreshing(false);
            }
        }
    },[project?._id]);

    const scheduleRefresh=useCallback(()=>{
        if(!project?._id)return;

        if(refreshTimerRef.current){
            clearTimeout(refreshTimerRef.current);
        }

        refreshTimerRef.current=setTimeout(()=>{
            refreshTimerRef.current=null;
            fetchFileTree({initial:false});
        },150);
    },[project?._id,fetchFileTree]);

    useEffect(()=>{
        const nextProjectId=project?._id||null;
        const previousProjectId=previousProjectIdRef.current;

        if(!nextProjectId){
            previousProjectIdRef.current=null;
            setFileTree([]);
            return;
        }

        if(
            previousProjectId!==null&&
            previousProjectId!==nextProjectId
        ){
            clearOpenFiles();
        }

        previousProjectIdRef.current=nextProjectId;
        setFileTree([]);

        if(refreshTimerRef.current){
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current=null;
        }

        fetchFileTree({initial:true});
    },[project?._id,fetchFileTree,clearOpenFiles]);

    useEffect(()=>{
        const handleWorkspaceChanged=event=>{
            const eventProjectId=String(
                event?.detail?.projectId||""
            );

            if(!project?._id)return;

            if(
                eventProjectId&&
                eventProjectId!==String(project._id)
            ){
                return;
            }

            console.log(
                `Workspace changed → refreshing ${project._id}`
            );

            scheduleRefresh();
        };

        window.addEventListener(
            "zs-code-workspace-changed",
            handleWorkspaceChanged
        );

        return()=>{
            window.removeEventListener(
                "zs-code-workspace-changed",
                handleWorkspaceChanged
            );
        };
    },[project?._id,scheduleRefresh]);

    useEffect(()=>{
        const handleAIFileTreeChanged=event=>{
            const eventProjectId=event?.detail?.projectId;

            if(!project?._id)return;

            if(
                eventProjectId&&
                String(eventProjectId)!==String(project._id)
            ){
                return;
            }

            scheduleRefresh();
        };

        window.addEventListener(
            "zs-code-file-tree-changed",
            handleAIFileTreeChanged
        );

        return()=>{
            window.removeEventListener(
                "zs-code-file-tree-changed",
                handleAIFileTreeChanged
            );
        };
    },[project?._id,scheduleRefresh]);

    useEffect(()=>{
        return()=>{
            if(refreshTimerRef.current){
                clearTimeout(refreshTimerRef.current);
            }

            requestIdRef.current++;
        };
    },[]);

    const handleOpenFile=async node=>{
        if(!node||node.type!=="file")return;

        try{
            const file=await getFile(node._id||node.id);

            if(file){
                openFile(file);
            }
        }catch(error){
            console.error("Open file error:",error);

            toast.error(
                error?.response?.data?.message||
                "Unable to open file."
            );
        }
    };

    if(!project){
        return(
            <div className="flex h-full w-full flex-col overflow-hidden">
                <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                    <FaCode className={`mb-3 text-4xl ${isDark?"text-white/20":"text-slate-300"}`}/>
                    <p className={`font-plex tracking-wide text-[13px] ${isDark?"text-white/40":"text-slate-300"}`}>
                        Select or create a project from Home to Open its Files
                    </p>
                </div>
            </div>
        );
    }

    if(initialLoading&&fileTree.length===0){
        return(
            <div className="flex h-full w-full items-center justify-center">
                <span className={`font-plex text-[12px] ${isDark?"text-white/40":"text-slate-400"}`}>
                    Loading files...
                </span>
            </div>
        );
    }

    return(
        <div className="flex h-full w-full flex-col overflow-hidden">
            <div className={`explorer-scroll relative min-h-0 flex-1 overflow-y-auto p-2 ${isDark?"explorer-scroll-dark":"explorer-scroll-light"}`}>
                <FileTree
                    tree={fileTree}
                    projectId={project._id}
                    isDark={isDark}
                    onRefresh={()=>fetchFileTree({initial:false})}
                    onOpenFile={handleOpenFile}
                />

                {refreshing&&(
                    <div className={`pointer-events-none absolute right-2 top-1 flex items-center gap-1.5 rounded-md border px-2 py-1 font-plex text-[9px] ${isDark?"border-white/10 bg-[#181818]/90 text-white/40":"border-black/10 bg-white/90 text-slate-400"}`}>
                        <FaSyncAlt className="animate-spin text-[8px]"/>
                        <span>Updating</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;