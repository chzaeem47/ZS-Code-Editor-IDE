import { redis } from "../../../shared/redis/redis.js"

export const protect = async(req,res,next)=>{

    try {
        
        const sessionID = req.cookies?.session
        if(!sessionID){
            return res.status(401).json({message : "Unauthorized Access"})
        }

        const result = await redis.get(`session:${sessionID}`)
        if(!result){
            return res.status(401).json({message : "Session Not Found"})
        }

        const data = JSON.parse(result)
        req.user = data

        next()
    } catch (error) {
        return res.status(500).json({message : `Protect Middleware Error ${error}`})
    }
}