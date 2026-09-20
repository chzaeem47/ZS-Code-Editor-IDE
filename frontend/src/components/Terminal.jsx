import {useEffect,useRef,useState} from "react";
import {FaTerminal,FaTimes,FaExpandAlt} from "react-icons/fa";
import {Terminal as XTerminal} from "@xterm/xterm";
import {FitAddon} from "@xterm/addon-fit";
import {io} from "socket.io-client";
import "@xterm/xterm/css/xterm.css";
import {useTheme} from "../context/ThemeContext";

const TERMINAL_URL=import.meta.env.VITE_TERMINAL_URL||"http://localhost:3005";

const Terminal=({isOpen,onClose,projectId,userId})=>{
    const {isDark}=useTheme();
    const terminalRef=useRef(null);
    const xtermRef=useRef(null);
    const fitRef=useRef(null);
    const socketRef=useRef(null);
    const [maximized,setMaximized]=useState(false);

    useEffect(()=>{
        if(!isOpen||!projectId||!terminalRef.current)return;

        const term=new XTerminal({
            cursorBlink:true,
            fontSize:13,
            fontFamily:"Consolas, 'Courier New', monospace",
            scrollback:5000,
            convertEol:true,
            theme:isDark?{
                background:"#181818",
                foreground:"#e5e7eb",
                cursor:"#7C3AED",
                selectionBackground:"#7C3AED66"
            }:{
                background:"#fafafa",
                foreground:"#1f2937",
                cursor:"#7C3AED",
                selectionBackground:"#7C3AED44"
            }
        });

        const fitAddon=new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        const socket=io(TERMINAL_URL,{
            withCredentials:true,
            transports:["websocket"],
            auth:{userId}
        });

        xtermRef.current=term;
        fitRef.current=fitAddon;
        socketRef.current=socket;

        const handleResize=()=>{
            if(!xtermRef.current||!fitRef.current||!socket.connected)return;
            fitRef.current.fit();
            socket.emit("terminal:resize",{
                cols:xtermRef.current.cols,
                rows:xtermRef.current.rows
            });
        };

        const handleData=(data)=>term.write(data);
        const handleReady=({cols,rows,cwd})=>{
            term.write(`\r\n\x1b[32mZS Code Terminal\x1b[0m\r\n`);
            term.write(`\x1b[90mWorkspace: ${cwd}\x1b[0m\r\n\r\n`);
            socket.emit("terminal:resize",{cols,rows});
            term.focus();
        };
        const handleError=({message})=>{
            term.write(`\r\n\x1b[31m[Terminal Error] ${message}\x1b[0m\r\n`);
        };
        const handleConnectError=(error)=>{
            term.write(`\r\n\x1b[31m[Connection Error] ${error.message}\x1b[0m\r\n`);
        };

        socket.on("terminal:data",handleData);
        socket.on("terminal:ready",handleReady);
        socket.on("terminal:error",handleError);
        socket.on("connect_error",handleConnectError);

        const inputDisposable=term.onData((data)=>{
            socket.emit("terminal:write",data);
        });

        const resizeObserver=new ResizeObserver(handleResize);
        resizeObserver.observe(terminalRef.current);
        window.addEventListener("resize",handleResize);

        socket.on("connect",()=>{
            fitAddon.fit();
            socket.emit("terminal:init",{
                projectId,
                cols:term.cols,
                rows:term.rows
            });
        });

        return ()=>{
            inputDisposable.dispose();
            resizeObserver.disconnect();
            window.removeEventListener("resize",handleResize);
            socket.removeAllListeners();
            socket.disconnect();
            term.dispose();
            xtermRef.current=null;
            fitRef.current=null;
            socketRef.current=null;
        };
    },[isOpen,projectId,userId]);

    useEffect(()=>{
        if(!xtermRef.current||!fitRef.current)return;
        requestAnimationFrame(()=>{
            fitRef.current.fit();
            const socket=socketRef.current;
            if(socket?.connected){
                socket.emit("terminal:resize",{
                    cols:xtermRef.current.cols,
                    rows:xtermRef.current.rows
                });
            }
        });
    },[maximized,isDark]);

    return(
        <div className={`fixed left-72 right-0 bottom-0 z-[100] overflow-hidden border-t transition-transform duration-300 ease-out ${maximized?"top-0":"h-[42vh] min-h-[300px] max-h-[520px]"} ${isOpen?"translate-y-0":"translate-y-full"} ${isDark?"border-white/10 bg-[#181818]":"border-black/10 bg-white"}`}>
            <div className={`flex h-10 shrink-0 items-center justify-between border-b px-3 ${isDark?"border-white/10 bg-[#202020]":"border-black/10 bg-[#f5f5f5]"}`}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={onClose} title="Close terminal" className="h-3 w-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"/>
                        <button type="button" onClick={()=>setMaximized(false)} title="Minimize terminal" className="h-3 w-3 rounded-full bg-[#febc2e] transition-transform hover:scale-110"/>
                        <button type="button" onClick={()=>setMaximized(p=>!p)} title={maximized?"Restore terminal":"Maximize terminal"} className="h-3 w-3 rounded-full bg-[#28c840] transition-transform hover:scale-110"/>
                    </div>
                    <div className={`ml-2 flex items-center gap-2 font-plex text-sm ${isDark?"text-white/70":"text-slate-600"}`}>
                        <FaTerminal className="text-[12px]"/>
                        <span>Terminal</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={()=>setMaximized(p=>!p)} title={maximized?"Restore":"Maximize"} className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${isDark?"text-white/50 hover:bg-white/10 hover:text-white":"text-slate-500 hover:bg-black/5 hover:text-slate-800"}`}>
                        <FaExpandAlt className="text-[11px]"/>
                    </button>
                    <button type="button" onClick={onClose} title="Close terminal" className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${isDark?"text-white/50 hover:bg-white/10 hover:text-white":"text-slate-500 hover:bg-black/5 hover:text-slate-800"}`}>
                        <FaTimes className="text-[13px]"/>
                    </button>
                </div>
            </div>
            <div ref={terminalRef} className="h-[calc(100%-40px)] w-full overflow-hidden p-3"/>
        </div>
    );
};

export default Terminal;