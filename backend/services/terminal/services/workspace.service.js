import path from "path";
import os from "os";
import fs from "fs/promises";

const WORKSPACE_ROOT=path.resolve(process.env.WORKSPACE_ROOT||path.join(os.tmpdir(),"zs-code"));
const isValidProjectId=projectId=>/^[a-f\d]{24}$/i.test(String(projectId));

export const getWorkspacePath=projectId=>{
    if(!isValidProjectId(projectId)) throw new Error("Invalid project ID");
    return path.join(WORKSPACE_ROOT,String(projectId));
};

export const ensureWorkspace=async projectId=>{
    const workspacePath=getWorkspacePath(projectId);
    await fs.mkdir(workspacePath,{recursive:true});
    return process.platform==="win32"
        ? await fs.realpath(workspacePath)
        : workspacePath;
};

export const isWorkspacePath=(targetPath,projectId)=>{
    const root=getWorkspacePath(projectId);
    const target=path.resolve(targetPath);
    const relative=path.relative(root,target);
    return relative===""||(!relative.startsWith("..")&&!path.isAbsolute(relative));
};

export const removeWorkspace=async projectId=>{
    await fs.rm(getWorkspacePath(projectId),{recursive:true,force:true});
};

export const getWorkspaceRoot=()=>WORKSPACE_ROOT;