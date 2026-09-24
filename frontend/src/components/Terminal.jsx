import { useEffect,useRef,useState } from "react";
import { FaTerminal } from "react-icons/fa";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io } from "socket.io-client";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "../context/ThemeContext";

const TERMINAL_URL=import.meta.env.VITE_TERMINAL_URL||"http://localhost:3005";

const Terminal=({isOpen,onClose,projectId,userId,aiOpen})=>{
    const {isDark}=useTheme();
    const terminalRef=useRef(null);
    const xtermRef=useRef(null);
    const fitRef=useRef(null);
    const socketRef=useRef(null);
    const [windowMode,setWindowMode]=useState("normal");
    const [restoreMode,setRestoreMode]=useState("normal");
    const isMaximized=windowMode==="maximized";
    const isMinimized=windowMode==="minimized";

    useEffect(()=>{
        if(!isOpen||!projectId||!terminalRef.current)return;
        const term=new XTerminal({
            cursorBlink:true,
            fontSize:15,
            fontFamily:"Consolas, 'Courier New', monospace",
            scrollback:5000,
            convertEol:true,
            theme:isDark
                ?{background:"#181818",foreground:"#e5e7eb",cursor:"#7C3AED",selectionBackground:"#7C3AED66"}
                :{background:"#fafafa",foreground:"#1f2937",cursor:"#7C3AED",selectionBackground:"#7C3AED44"}
        });
        const fitAddon=new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        requestAnimationFrame(()=>{try{fitAddon.fit();}catch{}});
        const socketInstance=io(TERMINAL_URL,{withCredentials:true,transports:["websocket"],auth:{userId,protocolVersion:"1.0"}});
        xtermRef.current=term;
        fitRef.current=fitAddon;
        socketRef.current=socketInstance;

        const handleResize=()=>{
            if(!xtermRef.current||!fitRef.current)return;
            requestAnimationFrame(()=>{
                try{fitRef.current.fit();}catch{return;}
                if(socketInstance.connected&&xtermRef.current)socketInstance.emit("terminal:resize",{cols:xtermRef.current.cols,rows:xtermRef.current.rows});
            });
        };
        const handleData=data=>term.write(data);
        const handleReady=({cols,rows,previewUrl})=>{
            socketInstance.emit("terminal:resize",{cols,rows});
            if(previewUrl)window.dispatchEvent(new CustomEvent("zs-code-static-preview-ready",{detail:{projectId,previewUrl}}));
            term.focus();
        };
        const handlePortDetected=payload=>{
            if(!payload?.port)return;
            window.dispatchEvent(new CustomEvent("zs-code-port-detected",{detail:{projectId,port:payload.port,previewUrl:payload.previewUrl||`http://localhost:${payload.port}`}}));
        };
        const handleError=({message})=>term.write(`\r\n\x1b[31m[Terminal Error] ${message||"Unknown terminal error"}\x1b[0m\r\n`);
        const handleConnectError=error=>term.write(`\r\n\x1b[31m[Connection Error] ${error?.message||"Unable to connect"}\x1b[0m\r\n`);
        const handleWorkspaceChanged=payload=>window.dispatchEvent(new CustomEvent("zs-code-workspace-changed",{detail:payload}));

        socketInstance.on("terminal:data",handleData);
        socketInstance.on("terminal:ready",handleReady);
        socketInstance.on("terminal:error",handleError);
        socketInstance.on("terminal:port-detected",handlePortDetected);
        socketInstance.on("connect_error",handleConnectError);
        socketInstance.on("workspace:changed",handleWorkspaceChanged);

        const inputDisposable=term.onData(data=>{
            if(socketInstance.connected)socketInstance.emit("terminal:write",data);
        });
        const resizeObserver=new ResizeObserver(handleResize);
        resizeObserver.observe(terminalRef.current);
        window.addEventListener("resize",handleResize);

        socketInstance.on("connect",()=>{
            requestAnimationFrame(()=>{
                try{fitAddon.fit();}catch{}
                socketInstance.emit("terminal:init",{projectId,cols:term.cols,rows:term.rows},response=>{
                    if(!response?.success)term.write(`\r\n\x1b[31m[Init Error] ${response?.message||"Unknown error"}\x1b[0m\r\n`);
                    else term.focus();
                });
            });
        });
        socketInstance.io.on("reconnect_attempt",attempt=>term.write(`\r\n\x1b[90m[Reconnecting... ${attempt}]\x1b[0m\r\n`));
        socketInstance.io.on("reconnect",()=>term.write("\x1b[32m[Reconnected]\x1b[0m\r\n"));

        return()=>{
            inputDisposable.dispose();
            resizeObserver.disconnect();
            window.removeEventListener("resize",handleResize);
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
            term.dispose();
            socketRef.current=null;
            xtermRef.current=null;
            fitRef.current=null;
        };
    },[isOpen,projectId,userId,isDark]);

    useEffect(()=>{
        if(!isOpen){
            setWindowMode("normal");
            setRestoreMode("normal");
        }
    },[isOpen]);

    useEffect(()=>{
        if(!isOpen||!xtermRef.current||!fitRef.current)return;
        const frame=requestAnimationFrame(()=>{
            requestAnimationFrame(()=>{
                if(!xtermRef.current||!fitRef.current)return;
                try{fitRef.current.fit();}catch{return;}
                const socket=socketRef.current;
                if(socket?.connected)socket.emit("terminal:resize",{cols:xtermRef.current.cols,rows:xtermRef.current.rows});
            });
        });
        return()=>cancelAnimationFrame(frame);
    },[windowMode,isDark,aiOpen,isOpen]);

    const handleClose=()=>onClose?.();

    const handleMinimize=()=>{
        if(isMinimized)return;
        setRestoreMode(isMaximized?"maximized":"normal");
        setWindowMode("minimized");
    };

    const handleMaximize=()=>{
        if(isMinimized){
            setWindowMode(restoreMode);
            return;
        }
        setWindowMode(previous=>previous==="maximized"?"normal":"maximized");
    };

    return(
        <div className={`fixed left-72 bottom-0 z-[100] flex flex-col overflow-hidden border-t transition-all duration-300 ease-out ${isMaximized?"top-0":"h-[42vh] min-h-[300px] max-h-[520px]"} ${aiOpen&&!isMaximized?"right-[390px]":"right-0"} ${isOpen?isMinimized?"translate-y-[calc(100%-2.5rem)]":"translate-y-0":"translate-y-full"} ${isDark?"border-white/10 bg-[#181818]":"border-black/10 bg-white"}`}>
            <div className={`flex h-10 shrink-0 items-center justify-between border-b px-3 ${isDark?"border-white/10 bg-[#202020]":"border-black/10 bg-[#f5f5f5]"}`}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={handleClose} title="Close terminal" aria-label="Close terminal" className="h-3 w-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"/>
                        <button type="button" onClick={handleMinimize} title="Minimize terminal" aria-label="Minimize terminal" className="h-3 w-3 rounded-full bg-[#febc2e] transition-transform hover:scale-110"/>
                        <button type="button" onClick={handleMaximize} title={isMinimized?"Restore terminal":isMaximized?"Restore terminal":"Maximize terminal"} aria-label={isMinimized?"Restore terminal":isMaximized?"Restore terminal":"Maximize terminal"} className="h-3 w-3 rounded-full bg-[#28c840] transition-transform hover:scale-110"/>
                    </div>
                    <div className={`ml-2 flex items-center gap-2 font-plex text-sm ${isDark?"text-white/70":"text-slate-600"}`}>
                        <FaTerminal className="text-[12px]"/>
                        <span>Terminal</span>
                    </div>
                </div>
            </div>

            <div className={`font-plex tracking-widest flex shrink-0 flex-col gap-0 px-3 py-1 text-[13px] ${isDark?"text-purple-400":"bg-[#fafafa] text-slate-400"}`}>
                <span>ZS Code Developer Terminal</span>
                <span className={`text-[12px] tracking-wider ${isDark?"text-white/40":"text-slate-400"}`}>© 2026 ZS Code. All rights reserved</span>
            </div>

            <div className="relative min-h-0 flex-1">
                <div ref={terminalRef} className="zs-terminal h-full w-full overflow-hidden px-3 pb-8"/>
            </div>
        </div>
    );
};

export default Terminal;
