import { useEffect,useRef,useState } from "react";
import { createPortal } from "react-dom";
import {
    FaChevronDown,FaChevronRight,FaFolder,FaFolderOpen,FaPlus,
    FaFolderPlus,FaTrash,FaPen,FaRoute,FaDatabase,FaCogs,
    FaShieldAlt,FaServer,FaWrench,FaLayerGroup,FaFileCode,
    FaFileAlt,FaSlidersH,FaTerminal,FaCheck,FaCodeBranch
} from "react-icons/fa";
import { TbFolderCode } from "react-icons/tb";
import { VscFolderLibrary } from "react-icons/vsc";
import { PiFolderSimpleUserDuotone } from "react-icons/pi";
import {
    SiJavascript,SiTypescript,SiReact,SiJson,SiCss,
    SiHtml5,SiMarkdown,SiGit
} from "react-icons/si";
import { createFolder,createFile,updateFile,deleteFile } from "../features/file";

const getFolderVisual=(name="",isOpen=false)=>{
    const key=name.toLowerCase().trim();
    const folderMap={
        backend:{icon:FaServer,color:"text-yellow-400"},
        frontend:{icon:PiFolderSimpleUserDuotone,color:"text-blue-500"},
        src:{icon:TbFolderCode,color:"text-green-400"},
        app:{icon:TbFolderCode,color:"text-green-400"},
        lib:{icon:VscFolderLibrary,color:"text-purple-400"},
        core:{icon:VscFolderLibrary,color:"text-purple-400"},
        routes:{icon:FaRoute,color:"text-green-400"},
        route:{icon:FaRoute,color:"text-green-400"},
        controllers:{icon:FaCogs,color:"text-yellow-400"},
        controller:{icon:FaCogs,color:"text-yellow-400"},
        models:{icon:VscFolderLibrary,color:"text-red-500"},
        model:{icon:VscFolderLibrary,color:"text-red-400"},
        middleware:{icon:FaShieldAlt,color:"text-orange-400"},
        middlewares:{icon:FaShieldAlt,color:"text-orange-400"},
        services:{icon:FaServer,color:"text-sky-400"},
        service:{icon:FaServer,color:"text-sky-400"},
        repositories:{icon:FaDatabase,color:"text-red-400"},
        repository:{icon:FaDatabase,color:"text-red-400"},
        database:{icon:FaDatabase,color:"text-yellow-400"},
        db:{icon:FaDatabase,color:"text-yellow-400"},
        config:{icon:FaWrench,color:"text-cyan-400"},
        configs:{icon:FaWrench,color:"text-cyan-400"},
        utils:{icon:FaWrench,color:"text-green-400"},
        utility:{icon:FaWrench,color:"text-green-400"},
        utilities:{icon:FaWrench,color:"text-green-400"},
        helpers:{icon:FaWrench,color:"text-green-400"},
        helper:{icon:FaWrench,color:"text-green-400"},
        validators:{icon:FaShieldAlt,color:"text-orange-400"},
        validation:{icon:FaShieldAlt,color:"text-orange-400"},
        schemas:{icon:FaDatabase,color:"text-red-400"},
        schema:{icon:FaDatabase,color:"text-red-400"},
        workers:{icon:FaCogs,color:"text-purple-400"},
        worker:{icon:FaCogs,color:"text-purple-400"},
        jobs:{icon:FaCogs,color:"text-purple-400"},
        queues:{icon:FaCogs,color:"text-purple-400"},
        events:{icon:FaCodeBranch,color:"text-pink-400"},
        sockets:{icon:FaCodeBranch,color:"text-pink-400"},
        components:{icon:FaLayerGroup,color:"text-purple-400"},
        component:{icon:FaLayerGroup,color:"text-purple-400"},
        pages:{icon:FaLayerGroup,color:"text-purple-400"},
        views:{icon:FaLayerGroup,color:"text-purple-400"},
        layouts:{icon:FaLayerGroup,color:"text-purple-400"},
        hooks:{icon:FaWrench,color:"text-purple-400"},
        context:{icon:FaLayerGroup,color:"text-cyan-400"},
        contexts:{icon:FaLayerGroup,color:"text-cyan-400"},
        providers:{icon:FaLayerGroup,color:"text-cyan-400"},
        redux:{icon:FaCodeBranch,color:"text-purple-500"},
        store:{icon:FaDatabase,color:"text-purple-500"},
        slices:{icon:FaCodeBranch,color:"text-purple-400"},
        features:{icon:FaCodeBranch,color:"text-purple-400"},
        reducers:{icon:FaCodeBranch,color:"text-purple-400"},
        actions:{icon:FaCodeBranch,color:"text-purple-400"},
        api:{icon:FaServer,color:"text-sky-400"},
        assets:{icon:FaFolder,color:"text-orange-400"},
        images:{icon:FaFolder,color:"text-pink-400"},
        icons:{icon:FaFolder,color:"text-yellow-400"},
        styles:{icon:FaFolder,color:"text-sky-400"},
        css:{icon:FaFolder,color:"text-sky-400"},
        public:{icon:FaFolder,color:"text-blue-400"},
        static:{icon:FaFolder,color:"text-blue-400"},
        uploads:{icon:FaFolder,color:"text-orange-400"},
        downloads:{icon:FaFolder,color:"text-green-400"},
        test:{icon:FaFolder,color:"text-purple-400"},
        tests:{icon:FaFolder,color:"text-purple-400"},
        "__tests__":{icon:FaFolder,color:"text-purple-400"},
        specs:{icon:FaFolder,color:"text-purple-400"},
        e2e:{icon:FaFolder,color:"text-purple-400"},
        fixtures:{icon:FaFolder,color:"text-purple-400"},
        mocks:{icon:FaFolder,color:"text-purple-400"},
        docker:{icon:FaServer,color:"text-sky-400"},
        containers:{icon:FaServer,color:"text-sky-400"},
        deployment:{icon:FaServer,color:"text-sky-400"},
        deploy:{icon:FaServer,color:"text-sky-400"},
        nginx:{icon:FaServer,color:"text-green-500"},
        kubernetes:{icon:FaServer,color:"text-blue-500"},
        k8s:{icon:FaServer,color:"text-blue-500"},
        terraform:{icon:FaServer,color:"text-purple-500"},
        scripts:{icon:FaWrench,color:"text-yellow-400"},
        node_modules:{icon:FaFolder,color:"text-lime-400"},
        modules:{icon:FaFolder,color:"text-lime-400"},
        packages:{icon:FaFolder,color:"text-lime-400"},
        gateway:{icon:FaServer,color:"text-sky-400"},
        gateways:{icon:FaServer,color:"text-sky-400"},
        microservices:{icon:FaServer,color:"text-sky-400"},
        docs:{icon:FaFileAlt,color:"text-blue-300"},
        documentation:{icon:FaFileAlt,color:"text-blue-300"},
        examples:{icon:FaFileCode,color:"text-cyan-400"},
        ".git":{icon:SiGit,color:"text-red-400"},
        ".github":{icon:SiGit,color:"text-gray-400"},
        workflows:{icon:SiGit,color:"text-gray-400"},
        temp:{icon:FaFolder,color:"text-gray-400"},
        tmp:{icon:FaFolder,color:"text-gray-400"},
        logs:{icon:FaFolder,color:"text-gray-400"},
        cache:{icon:FaFolder,color:"text-gray-400"},
        data:{icon:FaDatabase,color:"text-yellow-400"},
        backup:{icon:FaFolder,color:"text-orange-400"},
        backups:{icon:FaFolder,color:"text-orange-400"},
        types:{icon:FaFileCode,color:"text-blue-400"},
        interfaces:{icon:FaFileCode,color:"text-blue-400"},
        constants:{icon:FaSlidersH,color:"text-yellow-400"}
    };
    return folderMap[key]||{icon:isOpen?FaFolderOpen:FaFolder,color:"text-sky-300"};
};

const getFileVisual=(name="")=>{
    const n=name.toLowerCase();
    if([".js",".mjs",".cjs"].some(x=>n.endsWith(x)))return{icon:SiJavascript,color:"text-yellow-400"};
    if([".ts",".mts",".cts"].some(x=>n.endsWith(x)))return{icon:SiTypescript,color:"text-blue-400"};
    if([".jsx",".tsx"].some(x=>n.endsWith(x)))return{icon:SiReact,color:"text-cyan-400"};
    if([".json",".json5",".jsonc"].some(x=>n.endsWith(x)))return{icon:SiJson,color:"text-yellow-300"};
    if([".css",".scss",".sass",".less"].some(x=>n.endsWith(x)))return{icon:SiCss,color:"text-sky-400"};
    if([".html",".htm"].some(x=>n.endsWith(x)))return{icon:SiHtml5,color:"text-orange-500"};
    if([".md",".mdx"].some(x=>n.endsWith(x)))return{icon:SiMarkdown,color:"text-blue-300"};
    if([".gitignore",".gitattributes",".gitmodules"].includes(n))return{icon:SiGit,color:"text-red-400"};
    if(n===".env"||n.startsWith(".env."))return{icon:FaSlidersH,color:"text-yellow-400"};
    if(["package.json","package-lock.json","npm-shrinkwrap.json"].includes(n))return{icon:FaFileCode,color:"text-lime-400"};
    if(["yarn.lock","pnpm-lock.yaml","bun.lockb"].includes(n))return{icon:FaFileCode,color:"text-orange-400"};
    if(n==="dockerfile"||n.startsWith("dockerfile."))return{icon:FaServer,color:"text-sky-400"};
    if(n.endsWith(".yml")||n.endsWith(".yaml"))return{icon:FaSlidersH,color:"text-red-300"};
    if(n.endsWith(".svg"))return{icon:FaFileCode,color:"text-orange-400"};
    if(n.endsWith(".xml"))return{icon:FaFileCode,color:"text-orange-300"};
    if([".graphql",".gql"].some(x=>n.endsWith(x)))return{icon:FaRoute,color:"text-pink-400"};
    if([".py",".pyw"].some(x=>n.endsWith(x)))return{icon:FaFileCode,color:"text-blue-400"};
    if(n.endsWith(".java"))return{icon:FaFileCode,color:"text-red-400"};
    if([".c",".h"].some(x=>n.endsWith(x)))return{icon:FaFileCode,color:"text-blue-300"};
    if([".cpp",".cc",".cxx",".hpp",".hh",".hxx"].some(x=>n.endsWith(x)))return{icon:FaFileCode,color:"text-blue-400"};
    if(n.endsWith(".cs"))return{icon:FaFileCode,color:"text-purple-400"};
    if(n.endsWith(".go"))return{icon:FaFileCode,color:"text-cyan-400"};
    if(n.endsWith(".rs"))return{icon:FaFileCode,color:"text-orange-400"};
    if(n.endsWith(".php"))return{icon:FaFileCode,color:"text-purple-400"};
    if([".rb",".rake"].some(x=>n.endsWith(x)))return{icon:FaFileCode,color:"text-red-400"};
    if([".kt",".kts"].some(x=>n.endsWith(x)))return{icon:FaFileCode,color:"text-purple-400"};
    if(n.endsWith(".swift"))return{icon:FaFileCode,color:"text-orange-400"};
    if(n.endsWith(".dart"))return{icon:FaFileCode,color:"text-cyan-400"};
    if([".sql",".sqlite",".db"].some(x=>n.endsWith(x)))return{icon:FaDatabase,color:"text-yellow-400"};
    if([".sh",".bash",".zsh",".fish"].some(x=>n.endsWith(x)))return{icon:FaTerminal,color:"text-green-400"};
    if(n.endsWith(".ps1"))return{icon:FaTerminal,color:"text-blue-400"};
    if(n.endsWith(".vue"))return{icon:FaFileCode,color:"text-green-400"};
    if(n.endsWith(".svelte"))return{icon:FaFileCode,color:"text-orange-500"};
    if(n.endsWith(".prisma"))return{icon:FaDatabase,color:"text-teal-400"};
    if(n.endsWith(".tf"))return{icon:FaServer,color:"text-purple-400"};
    if(["nginx.conf","nginx"].includes(n))return{icon:FaServer,color:"text-green-400"};
    if(["makefile","gnumakefile"].includes(n))return{icon:FaWrench,color:"text-gray-300"};
    if([".txt",".log"].some(x=>n.endsWith(x)))return{icon:FaFileAlt,color:"text-gray-400"};
    if([".png",".jpg",".jpeg",".gif",".webp",".ico"].some(x=>n.endsWith(x)))return{icon:FaFileAlt,color:"text-pink-400"};
    if([".mp3",".wav",".ogg"].some(x=>n.endsWith(x)))return{icon:FaFileAlt,color:"text-purple-400"};
    if([".mp4",".webm",".mov",".avi"].some(x=>n.endsWith(x)))return{icon:FaFileAlt,color:"text-red-400"};
    if(n.endsWith(".pdf"))return{icon:FaFileAlt,color:"text-red-500"};
    return{icon:FaFileCode,color:"text-gray-300"};
};

const ContextMenu=({ menu,isDark,onClose,onAction })=>{
    const menuRef=useRef(null);
    const [position,setPosition]=useState({x:menu.x,y:menu.y});
    useEffect(()=>{
        const update=()=>{
            if(!menuRef.current)return;
            const rect=menuRef.current.getBoundingClientRect();
            const pad=8;
            setPosition({
                x:Math.max(pad,Math.min(menu.x,window.innerWidth-rect.width-pad)),
                y:Math.max(pad,Math.min(menu.y,window.innerHeight-rect.height-pad))
            });
        };
        requestAnimationFrame(update);
    },[menu.x,menu.y]);
    useEffect(()=>{
        const outside=e=>{
            if(menuRef.current&&!menuRef.current.contains(e.target))onClose();
        };
        const close=()=>onClose();
        document.addEventListener("mousedown",outside);
        window.addEventListener("scroll",close,true);
        window.addEventListener("resize",close);
        return()=>{
            document.removeEventListener("mousedown",outside);
            window.removeEventListener("scroll",close,true);
            window.removeEventListener("resize",close);
        };
    },[onClose]);
    const items=[
        {label:"Create Folder",icon:FaFolderPlus,action:"create-folder",visible:menu.node?.type==="folder"},
        {label:"Create File",icon:FaPlus,action:"create-file",visible:menu.node?.type==="folder"},
        {label:"Rename",icon:FaPen,action:"rename",visible:!menu.isRoot},
        {label:"Delete",icon:FaTrash,action:"delete",visible:!menu.isRoot,danger:true}
    ].filter(x=>x.visible);
    return createPortal(
        <div ref={menuRef} className={`fixed z-[999999] min-w-[185px] overflow-hidden rounded-md border shadow-2xl backdrop-blur-md select-none ${isDark?"border-gray-700 bg-[#181818]/98 text-gray-200":"border-gray-300 bg-white/98 text-gray-800"}`} style={{left:position.x,top:position.y}} onContextMenu={e=>e.preventDefault()}>
            {items.map((item,index)=>{
                const Icon=item.icon;
                return(
                    <button
                        key={item.action}
                        type="button"
                        onClick={()=>onAction(item.action)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors ${item.danger?"text-red-400 hover:bg-red-500/10":isDark?"hover:bg-[#2a2d2e]":"hover:bg-gray-100"} ${index!==items.length-1?(isDark?"border-b border-gray-800":"border-b border-gray-200"):""}`}
                    >
                        <Icon size={14} className={item.danger?"text-red-400":isDark?"text-gray-400":"text-gray-500"}/>
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

const FileTree=({ tree=[],projectId,isDark,onRefresh,onOpenFile })=>{
    const [expanded,setExpanded]=useState({});
    const [contextMenu,setContextMenu]=useState(null);
    const [busy,setBusy]=useState(false);
    const [inlineCreate,setInlineCreate]=useState(null);
    const [inlineError,setInlineError]=useState("");

    const getNodeId=node=>node?._id||node?.id;
    const isRootNode=node=>node?.type==="folder"&&node?.parentId===null;
    const getCreateParentId=node=>{
        if(!node)return null;
        return node.type==="folder"?getNodeId(node):node.parentId||null;
    };
    const findNodeById=(nodes,id)=>{
        for(const node of nodes){
            if(getNodeId(node)===id)return node;
            if(node.children?.length){
                const found=findNodeById(node.children,id);
                if(found)return found;
            }
        }
        return null;
    };
    const closeContextMenu=()=>setContextMenu(null);
    const toggleFolder=id=>setExpanded(prev=>({...prev,[id]:!prev[id]}));

    const startCreate=(node,type)=>{
        if(!node||busy)return;
        const parentId=getCreateParentId(node);
        if(!parentId)return;
        const nodeId=getNodeId(node);
        setExpanded(prev=>({...prev,[nodeId]:true}));
        setInlineError("");
        setInlineCreate({nodeId,type,value:""});
        closeContextMenu();
    };

    const handleInlineCreate=async()=>{
        const value=inlineCreate?.value?.trim();
        if(!value||busy)return;
        const parentNode=findNodeById(tree,inlineCreate.nodeId);
        if(!parentNode)return;
        const parentId=getCreateParentId(parentNode);
        try{
            setBusy(true);
            setInlineError("");
            if(inlineCreate.type==="file"){
                await createFile(projectId,value,parentId);
            }else{
                await createFolder(projectId,value,parentId);
            }
            setInlineCreate(null);
            await onRefresh?.();
        }catch(error){
            console.error("Create failed:",error);
            setInlineError(error?.response?.data?.message||"Unable to create item.");
        }finally{
            setBusy(false);
        }
    };

    const handleRename=async node=>{
        if(!node||isRootNode(node))return;
        const newName=window.prompt("Enter new name:",node.name);
        if(!newName?.trim()||newName.trim()===node.name)return;
        try{
            setBusy(true);
            await updateFile(getNodeId(node),{name:newName.trim()});
            closeContextMenu();
            await onRefresh?.();
        }catch(error){
            console.error("Rename failed:",error);
            alert(error?.response?.data?.message||"Failed to rename.");
        }finally{
            setBusy(false);
        }
    };

    const handleDelete=async node=>{
        if(!node||isRootNode(node))return;
        const confirmed=window.confirm(`Delete "${node.name}"?`);
        if(!confirmed)return;
        try{
            setBusy(true);
            await deleteFile(getNodeId(node));
            closeContextMenu();
            await onRefresh?.();
        }catch(error){
            console.error("Delete failed:",error);
            alert(error?.response?.data?.message||"Failed to delete.");
        }finally{
            setBusy(false);
        }
    };

    const handleContextAction=async action=>{
        const node=contextMenu?.node;
        if(!node)return;
        if(action==="create-folder"){
            startCreate(node,"folder");
            return;
        }
        if(action==="create-file"){
            startCreate(node,"file");
            return;
        }
        if(action==="rename"){
            await handleRename(node);
            return;
        }
        if(action==="delete"){
            await handleDelete(node);
        }
    };

    const handleContextMenu=(event,node)=>{
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            node,
            isRoot:isRootNode(node),
            x:event.clientX,
            y:event.clientY
        });
    };

    const renderInlineCreate=(node,depth)=>{
        const nodeId=getNodeId(node);
        if(!node||node.type!=="folder"||!expanded[nodeId]||inlineCreate?.nodeId!==nodeId)return null;
        return(
            <div className="flex items-center gap-2 py-0.5" style={{paddingLeft:`${depth*16+20}px`}} onClick={e=>e.stopPropagation()}>
                <div className="w-4 shrink-0"/>
                {inlineCreate.type==="folder"?(
                    <FaFolder className="shrink-0 text-[14px] text-yellow-400"/>
                ):(
                    <FaFileCode className="shrink-0 text-[14px] text-gray-400"/>
                )}
                <input
                    autoFocus
                    value={inlineCreate.value}
                    disabled={busy}
                    placeholder={inlineCreate.type==="file"?"File name":"Folder name"}
                    onChange={e=>{
                        setInlineCreate(prev=>({...prev,value:e.target.value}));
                        setInlineError("");
                    }}
                    onKeyDown={async e=>{
                        if(e.key==="Enter"){
                            e.preventDefault();
                            await handleInlineCreate();
                        }
                        if(e.key==="Escape"){
                            e.preventDefault();
                            setInlineCreate(null);
                            setInlineError("");
                        }
                    }}
                    className={`min-w-0 flex-1 rounded border px-2 py-1 text-[12px] outline-none ${isDark?"border-white/10 bg-[#242424] text-white placeholder:text-white/25 focus:border-cyan-400/50":"border-black/10 bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-400"}`}
                />
            </div>
        );
    };

    const renderNode=(node,depth=0)=>{
        const nodeId=getNodeId(node);
        const isFolder=node.type==="folder";
        const isRoot=isRootNode(node);
        const isExpanded=!!expanded[nodeId];
        const hasChildren=isFolder&&node.children?.length>0;
        const visual=isFolder?getFolderVisual(node.name,isExpanded):getFileVisual(node.name);
        const Icon=visual.icon;

        return(
            <div key={nodeId} className="w-full">
                <div
                    className={`group relative flex min-w-0 items-center rounded-sm py-[3px] pr-1 ${isRoot?"text-[15px]":"text-[14px]"} ${isDark?"hover:bg-[#2a2d2e]":"hover:bg-gray-100"} ${busy?"pointer-events-none opacity-70":""}`}
                    style={{paddingLeft:`${depth*16+4}px`}}
                    onContextMenu={e=>handleContextMenu(e,node)}
                >
                    {isFolder?(
                        <button type="button" className="mr-[2px] flex h-4 w-4 shrink-0 items-center justify-center text-gray-400" onClick={e=>{e.stopPropagation();toggleFolder(nodeId);}}>
                            {isExpanded?<FaChevronDown size={10}/>:<FaChevronRight size={10}/>}
                        </button>
                    ):(
                        <div className="mr-[2px] w-4 shrink-0"/>
                    )}
                    <Icon size={isRoot?16:15} className={`mr-2 shrink-0 ${visual.color}`}/>
                    <span
                        className={`min-w-0 flex-1 truncate ${isRoot?(isDark?"text-cyan-400":"text-cyan-600"):(isDark?"text-gray-200":"text-gray-700")}`}
                        onClick={()=>{
                            if(isFolder){
                                toggleFolder(nodeId);
                                return;
                            }
                            onOpenFile?.(node);
                        }}
                    >
                        {node.name}
                    </span>
                    {isFolder&&(
                        <div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                title="New File"
                                disabled={busy}
                                className={`flex h-5 w-5 items-center justify-center rounded ${isDark?"text-gray-400 hover:bg-[#3a3d3e] hover:text-white":"text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}
                                onClick={e=>{e.stopPropagation();startCreate(node,"file");}}
                                onContextMenu={e=>e.stopPropagation()}
                            >
                                <FaPlus size={11}/>
                            </button>
                            <button
                                type="button"
                                title="New Folder"
                                disabled={busy}
                                className={`flex h-5 w-5 items-center justify-center rounded ${isDark?"text-gray-400 hover:bg-[#3a3d3e] hover:text-white":"text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}
                                onClick={e=>{e.stopPropagation();startCreate(node,"folder");}}
                                onContextMenu={e=>e.stopPropagation()}
                            >
                                <FaFolderPlus size={12}/>
                            </button>
                        </div>
                    )}
                </div>
                {isFolder&&isExpanded&&hasChildren&&(
                    <div>{node.children.map(child=>renderNode(child,depth+1))}</div>
                )}
                {renderInlineCreate(node,depth)}
                {isFolder&&isExpanded&&inlineCreate?.nodeId===nodeId&&inlineError&&(
                    <div className="truncate px-2 py-0.5 text-[10px] text-red-400" style={{paddingLeft:`${depth*16+40}px`}}>
                        {inlineError}
                    </div>
                )}
            </div>
        );
    };

    if(!tree||tree.length===0){
        return(
            <div className={`px-4 py-6 text-center text-xs ${isDark?"text-gray-500":"text-gray-400"}`}>
                No files yet
            </div>
        );
    }

    return(
        <>
            <span className={`font-plex tracking-wider px-1 ${isDark?"text-white":"text-slate-700"}`}>File Explorer</span>
            <hr className="mt-1.5 mb-2 border-0 border-t border-gray-300/20"/>
            <div className="w-full min-w-0 select-none font-plex tracking-wide">
                {tree.map(node=>renderNode(node))}
            </div>
            {contextMenu&&(
                <ContextMenu
                    menu={contextMenu}
                    isDark={isDark}
                    onClose={closeContextMenu}
                    onAction={handleContextAction}
                />
            )}
        </>
    );
};

export default FileTree;