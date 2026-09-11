import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { graph } from '../lang/graph.js'

const buildHistory = (history)=>{
    if(!Array.isArray(history)){
        return []
    }

    const recents = history.slice(-6)

    return recents
        .filter((recent)=>recent?.content && (recent.role == "user" || recent.role == "assistant"))
        .map((msg)=>{
            if(msg.role == "user"){
                return new HumanMessage(msg.content)
            }

            return new AIMessage(msg.content)
        })
}

const sendEvent = (res,type,data)=>{
    if(res.writableEnded || res.destroyed){
        return false
    }

    try {
        res.write(`event:${type}\n`)
        res.write(`data:${JSON.stringify(data || {})}\n\n`)
        return true
    } catch (error) {
        console.log(`SSE Error: ${error}`)
        return false
    }
}

export const chat = async(req,res)=>{
    let disconnected = false

    try {
        const {projectId,message,history=[]} = req.body
        const userId = req.headers['x-user-id']

        if(!projectId){
            return res.status(401).json({message : "Project not Found"})
        }

        if(!message){
            return res.status(401).json({message: "Message not Found"})
        }

        res.setHeader(
            "Content-Type",
            "text/event-stream; charset=utf-8"
        )

        res.setHeader(
            "Cache-Control",
            "no-cache, no-transform"
        )

        res.setHeader(
            "Connection",
            "keep-alive"
        )

        res.setHeader(
            "X-Accel-Buffering",
            "no"
        )

        res.flushHeaders?.()

        res.once("close",()=>{
            disconnected = true
            console.log('AI CLIENT DISCONNECTED')
        })

        sendEvent(res,"start",{
            success:true,
            message:"AI Started"
        })

        const graphData = graph({projectId,userId})
        const messages = buildHistory(history)

        messages.push(new HumanMessage(message.trim()))

        const stream = await graphData.stream(
            {
                messages
            },
            {
                streamMode:"updates",
                recursionLimit:40
            }
        )

        let finalMessage = ""

        for await(const chunk of stream){
            if(disconnected || res.writableEnded) break

            if(chunk?.agent){
                const agentMessages = chunk.agent.messages || []
                const last = agentMessages[agentMessages.length - 1]

                if(!last){
                    continue
                }

                if(Array.isArray(last.tool_calls) && last.tool_calls.length){
                    for(const call of last.tool_calls){
                        sendEvent(res,"tool_start",{
                            tool:call.name,
                            args:call.args || {}
                        })
                    }

                    continue
                }

                let content = ""

                if(typeof last.content == "string"){
                    content = last.content
                }else if(Array.isArray(last.content)){
                    content = last.content
                        .filter((item)=>item.type == "text")
                        .map((item)=>item.text)
                        .join("")
                }

                if(content){
                    finalMessage = content
                    sendEvent(res,"message",{content})
                }
            }

            if(chunk?.tools){
                const toolMessages = chunk.tools?.messages || []

                for(const toolMessage of toolMessages){
                    let result = null

                    try {
                        if(typeof toolMessage == "string"){
                            result = JSON.parse(toolMessage)
                        }else if(toolMessage?.content){
                            if(typeof toolMessage.content == "string"){
                                try {
                                    result = JSON.parse(toolMessage.content)
                                } catch {
                                    result = toolMessage.content
                                }
                            }else{
                                result = toolMessage.content
                            }
                        }
                    } catch (error) {
                        result = null
                    }

                    if(result?.operation){
                        sendEvent(res,result.operation,result)
                        continue
                    }

                    sendEvent(res,"tool_result",{
                        result
                    })
                }
            }
        }

        if(!disconnected && !res.writableEnded){
            sendEvent(res,"done",{
                success:true,
                message:finalMessage || "done"
            })

            res.end()
        }

    } catch (error) {
        console.log(`AI Stream Error : ${error}`)

        if(disconnected){
            return
        }

        if(res.headersSent){
            sendEvent(res,"error",{
                success:false,
                message:error?.message || "AI Req Failed"
            })
        }

        if(!res.writableEnded){
            res.end()
        }

        return
    }
}
