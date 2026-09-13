import { createContext,useCallback,useContext,useEffect,useMemo,useState } from "react";

const WorkspaceContext=createContext(null);

export const WorkspaceProvider=({children})=>{
    const [viewMode,setViewMode]=useState("code");
    const [openFiles,setOpenFiles]=useState([]);
    const [activeFileId,setActiveFileId]=useState(null);
    const [activeProject,setActiveProject]=useState(null);

    const activeFile=openFiles.find(file=>(file?._id||file?.id)===activeFileId)||null;

    const openFile=useCallback(file=>{
        if(!file)return;
        const id=file._id||file.id;
        if(!id)return;

        setOpenFiles(previous=>{
            const exists=previous.some(item=>(item?._id||item?.id)===id);
            return exists
                ?previous.map(item=>
                    (item?._id||item?.id)===id
                        ?{...item,...file}
                        :item
                )
                :[...previous,file];
        });

        setActiveFileId(id);
    },[]);

    const activateFile=useCallback(id=>{
        if(openFiles.some(file=>(file?._id||file?.id)===id)){
            setActiveFileId(id);
        }
    },[openFiles]);

    const closeFile=useCallback(id=>{
        setOpenFiles(previous=>{
            const index=previous.findIndex(file=>(file?._id||file?.id)===id);
            if(index===-1)return previous;

            const next=previous.filter(
                file=>(file?._id||file?.id)!==id
            );

            setActiveFileId(current=>
                current===id
                    ?(next[Math.max(0,index-1)]?._id||
                      next[Math.max(0,index-1)]?.id)||null
                    :current
            );

            return next;
        });
    },[]);

    const clearOpenFiles=useCallback(()=>{
        setOpenFiles([]);
        setActiveFileId(null);
    },[]);

    const updateOpenFile=useCallback((id,changes)=>{
        setOpenFiles(previous=>
            previous.map(file=>
                (file?._id||file?.id)===id
                    ?{...file,...changes}
                    :file
            )
        );
    },[]);

    useEffect(()=>{
        const syncAIFile=event=>{
            const detail=event.detail||{};
            if(detail.eventType!=="file_updated")return;

            const file=detail.file||{};
            const id=file._id||file.id;
            if(!id)return;

            setOpenFiles(previous=>
                previous.map(openFile=>
                    (openFile?._id||openFile?.id)===id
                        ?{
                            ...openFile,
                            ...file,
                            content:file.content??openFile.content
                        }
                        :openFile
                )
            );
        };

        window.addEventListener(
            "zs-code-file-tree-changed",
            syncAIFile
        );

        return()=>{
            window.removeEventListener(
                "zs-code-file-tree-changed",
                syncAIFile
            );
        };
    },[]);

    const value=useMemo(()=>({
        viewMode,setViewMode,
        openFiles,activeFileId,activeFile,
        openFile,activateFile,closeFile,
        clearOpenFiles,updateOpenFile,
        activeProject,setActiveProject
    }),[
        viewMode,
        openFiles,
        activeFileId,
        activeFile,
        openFile,
        activateFile,
        closeFile,
        clearOpenFiles,
        updateOpenFile,
        activeProject
    ]);

    return(
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace=()=>{
    const context=useContext(WorkspaceContext);

    if(!context){
        throw new Error(
            "useWorkspace must be used inside WorkspaceProvider"
        );
    }

    return context;
};

export default WorkspaceContext;