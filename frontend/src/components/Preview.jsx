import { useCallback,useEffect,useMemo,useState } from "react";
import { FaDesktop,FaSyncAlt } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { getFile,getFileTree } from "../features/file";

const ext=file=>(
    file?.extension||
    file?.name?.split(".").pop()||
    ""
).toLowerCase();

const isHtml=file=>["html","htm"].includes(ext(file));
const isCss=file=>["css","scss","sass","less"].includes(ext(file));
const isJs=file=>["js","mjs","cjs"].includes(ext(file));

const flattenTree=(nodes=[],result=[])=>{
    for(const node of nodes){
        if(node.type==="file")result.push(node);
        if(node.children?.length)flattenTree(node.children,result);
    }
    return result;
};

const escapeScript=code=>code.replace(/<\/script/gi,"<\\/script");

const Preview=()=>{
    const { isDark }=useTheme();
    const { activeFile }=useWorkspace();
    const [project,setProject]=useState(null);
    const [tree,setTree]=useState([]);
    const [files,setFiles]=useState([]);
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState("");
    const [version,setVersion]=useState(0);

    useEffect(()=>{
        const handleOpenProject=event=>{
            const nextProject=event.detail||null;
            setProject(nextProject);
            setVersion(v=>v+1);
        };

        const handleActiveProjectResponse=event=>{
            const nextProject=event.detail||null;
            if(!nextProject?._id)return;
            setProject(nextProject);
            setVersion(v=>v+1);
        };

        const handleDeletedProjects=event=>{
            const ids=event.detail?.projectIds||[];
            setProject(prev=>{
                if(!prev)return null;
                return ids.includes(prev._id)?null:prev;
            });
        };

        window.addEventListener("zs-code-open-project",handleOpenProject);
        window.addEventListener("zs-code-active-project-response",handleActiveProjectResponse);
        window.addEventListener("zs-code-projects-deleted",handleDeletedProjects);

        window.dispatchEvent(
            new CustomEvent("zs-code-request-active-project")
        );

        return()=>{
            window.removeEventListener("zs-code-open-project",handleOpenProject);
            window.removeEventListener("zs-code-active-project-response",handleActiveProjectResponse);
            window.removeEventListener("zs-code-projects-deleted",handleDeletedProjects);
        };
    },[]);

    useEffect(()=>{
        const refresh=event=>{
            const eventProjectId=event.detail?.projectId;
            if(
                project?._id&&
                (eventProjectId===undefined||eventProjectId===null||eventProjectId===project._id)
            ){
                setVersion(v=>v+1);
            }
        };

        window.addEventListener("zs-code-preview-changed",refresh);
        window.addEventListener("zs-code-file-tree-changed",refresh);

        return()=>{
            window.removeEventListener("zs-code-preview-changed",refresh);
            window.removeEventListener("zs-code-file-tree-changed",refresh);
        };
    },[project?._id]);

    const loadProject=useCallback(async()=>{
        if(!project?._id){
            setTree([]);
            setFiles([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try{
            const nextTree=await getFileTree(project._id);
            const safeTree=Array.isArray(nextTree)?nextTree:[];
            const nodes=flattenTree(safeTree);

            const contents=await Promise.all(
                nodes.map(async node=>{
                    try{
                        const file=await getFile(node._id||node.id);
                        return file||{...node,content:""};
                    }catch{
                        return {...node,content:""};
                    }
                })
            );

            setTree(safeTree);
            setFiles(contents);
        }catch(err){
            console.error("Preview load error:",err);
            setTree([]);
            setFiles([]);
            setError(
                err?.response?.data?.message||
                "Unable to load project preview."
            );
        }finally{
            setLoading(false);
        }
    },[project?._id]);

    useEffect(()=>{
        loadProject();
    },[loadProject,version]);

    const previewFile=useMemo(()=>{
        if(!files.length)return null;

        const activeId=activeFile?._id||activeFile?.id;

        if(activeId){
            const active=files.find(
                file=>(file._id||file.id)===activeId
            );

            if(active&&isHtml(active))return active;
        }

        return(
            files.find(
                file=>file.name?.toLowerCase()==="index.html"
            )||
            files.find(isHtml)||
            null
        );
    },[files,activeFile]);

    const previewDocument=useMemo(()=>{
        if(!previewFile)return "";

        let html=previewFile.content||"";

        const cssFiles=files.filter(isCss);
        const jsFiles=files.filter(isJs);

        const css=cssFiles
            .map(file=>`\n/* ${file.name} */\n${file.content||""}`)
            .join("\n");

        const js=jsFiles
            .map(file=>`\n/* ${file.name} */\n${escapeScript(file.content||"")}`)
            .join("\n");

        const styleTag=css
            ?`<style data-zs-code-project-css="true">${css}</style>`
            :"";

        const scriptTag=js
            ?`<script data-zs-code-project-js="true">${js}</script>`
            :"";

        if(/<\/head>/i.test(html)){
            html=html.replace(
                /<\/head>/i,
                `${styleTag}</head>`
            );
        }else{
            html=`${styleTag}${html}`;
        }

        if(/<\/body>/i.test(html)){
            html=html.replace(
                /<\/body>/i,
                `${scriptTag}</body>`
            );
        }else{
            html=`${html}${scriptTag}`;
        }

        return html;
    },[files,previewFile]);

    if(!project){
        return(
            <div className={`flex h-full w-full items-center justify-center ${
                isDark
                    ?"bg-[#0d1117] text-white/30"
                    :"bg-white text-slate-400"
            }`}>
                <div className="text-center">
                    <FaDesktop className="mx-auto mb-4 text-5xl opacity-40"/>
                    <p className="font-plex text-[15px]">
                        Open a project to preview it
                    </p>
                </div>
            </div>
        );
    }

    if(loading){
        return(
            <div className={`flex h-full w-full items-center justify-center ${
                isDark
                    ?"bg-[#0d1117] text-white/35"
                    :"bg-white text-slate-400"
            }`}>
                <div className="text-center">
                    <FaSyncAlt className="mx-auto mb-3 animate-spin text-xl opacity-60"/>
                    <p className="font-plex text-sm">
                        Loading project preview...
                    </p>
                </div>
            </div>
        );
    }

    if(error){
        return(
            <div className={`flex h-full w-full items-center justify-center ${
                isDark
                    ?"bg-[#0d1117] text-red-300"
                    :"bg-white text-red-500"
            }`}>
                <div className="max-w-md px-6 text-center">
                    <p className="font-plex text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if(!previewFile){
        return(
            <div className={`flex h-full w-full items-center justify-center ${
                isDark
                    ?"bg-[#0d1117] text-white/35"
                    :"bg-white text-slate-400"
            }`}>
                <div className="text-center">
                    <FaDesktop className="mx-auto mb-4 text-4xl opacity-40"/>
                    <p className="font-plex text-sm">
                        No HTML entry file found.
                    </p>
                    <p className="mt-1 text-xs opacity-60">
                        Create index.html to start the preview.
                    </p>
                </div>
            </div>
        );
    }

    return(
        <div className="h-full w-full bg-white">
            <iframe
                key={`${previewFile._id||previewFile.id}-${version}`}
                title="ZS CODE Preview"
                srcDoc={previewDocument}
                sandbox="allow-scripts allow-forms allow-modals"
                className="h-full w-full border-0"
            />
        </div>
    );
};

export default Preview;