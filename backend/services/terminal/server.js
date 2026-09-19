import express, { response } from "express";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import http from 'http'
import {Server} from 'socket.io'
import path from "path";
import os from 'os'
import pty from 'node-pty'
import { cwd } from "process";

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3005;

const fileServiceUrl = process.env.FILE_SERVICE_URL || "http://localhost:3003"

/*
* Temporary Folder 
* Its path be like //c://temp/zs-code/project id that we gave it to 
*/
const WORKSPACE_URL = path.join(os.tmpdir(),"zs-code")

const SHELL = process.platform=="win32"?"powershell.exe":"bash"

const server = http.Server(app)
const io = new Server(server,{
    cors:{
        credentials:true,
        origin:true
    }
})

const session = new Map();

const send=(socket,data)=>{
    if(!socket.connected){
        return;
    }

    socket.emit("terminal:data",String(data || ""))
}

const safeName = (name)=>{
    if(!name || name==="." || name===".." || name==="/" || name==="//" || name==="\\"){
        throw new Error(`Invalid File Folder Name ${name}`)
    }

    return name
}

const workspace = (projectId)=>{
    path.join(WORKSPACE_URL,String(projectId))
}

const normalizeCols = (cols)=>{
    const value = Number(cols)

    if(!Number.isFinite(value)){
        return 80;
    }

    Math.min(20,Math.max(Math.floor(value),500))
}

const normalizeRows = (rows)=>{
    const value = Number(rows)

    if(!Number.isFinite(value)){
        return 30;
    }

    Math.min(3,Math.max(Math.floor(value),200))
}

const getTree = async({projectId,userId})=>{

    const url = `${fileServiceUrl}/tree/${projectId}`

    const tree = await fetch(url,{
        headers:{
            'x-user-id':String(userId)
        }
    })

    const text = await response.text()
    let data = {}
    try {
        data = text?JSON.parse(text):{}
    } catch (error) {
        data = {message:text}
    }

    if(!response.ok){
        throw new Error(data?.message || `File Service returned ${response.status}`)
    }

    return Array.isArray(data.tree)?data.tree:[]
}

const writeNodes = async(nodes,directory)=>{
    if(!Array.isArray(nodes))return;

    for (const node of nodes) {
        const name = safeName(name)
        const target = path.join(directory,name)

        if(node.type==="folder"){
            await fs.mkdir(target,{recursive:true})

            writeNodes(node.children || [],target)
        }

        if(node.type==="file"){
            await fs.mkdir(path.dirname(target),{recursive:true})
            await fs.writeFile(target,node.content||"","utf8")
        }
    }
}

const syncProject = async(projectId,userId)=>{
    const tree = await getTree(projectId,userId)

    const root = workspace(projectId)
    await fs.mkdir(root,{recursive:true})

    if(tree.length==1 && tree[0]?.type=="folder"){
        await writeNodes(tree[0].children || [], root)
    }else{
        await writeNodes(tree,root)
    }

    return{tree,root}
}

io.on("connection",(socket)=>{
    console.log("Terminal Connected",socket?.id)

    socket.on("terminal:init",async({projectId,userId,cols=80,rows=30})=>{
        try {
            projectId = String(projectId)
            userId = String(userId)

            if(!userId || !projectId){
                throw new Error("Project Id & User Id are required")
            }

            const existingSession = session.get(socket.id)

            if(existingSession){
                try {
                    existingSession.ptyProcess.kill()
                } catch (error) {}

                session.delete(socket.id)
            }

            cols = normalizeCols(cols)
            rows = normalizeRows(rows)

            const {root} = await syncProject(projectId,userId)

            const ptyProcess = pty.spawn(
                SHELL,
                [],
                {
                    name:"xterm-256color",
                    cols,
                    rows,
                    cwd:root,
                    env:{
                        ...process.env,
                        FORCE_COLOR : "1"
                    }
                }
            )

            ptyProcess.onData((data)=>{
                send(socket,data)
            })

            ptyProcess.onExit(({exitCode})=>{
                send(socket,`\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`)
                const session = session.get(socket.id)

                if(session?.ptyProcess==ptyProcess){
                    session.delete(socket.id)
                }
            })

            session.set(socket.id,{
                projectId,
                userId,
                cwd:root,
                ptyProcess
            })

            socket.emit("terminal:ready",{cols,rows})

        } catch (error) {
            console.log("terminal:init error :",error)

            send(socket,`\r\n\x1b[31m${error.message}]\x1b[0m\r\n`)
        }
    })
})


const startServer = async () => {
    try {
        await connectDB();

        server.listen(port, () => {
            console.log(
                `Terminal Service is running on Port ${port}`
            );
        });
    } catch (error) {
        console.error(
            "Terminal Service startup failed:",
            error
        );

        process.exit(1);
    }
};

startServer();