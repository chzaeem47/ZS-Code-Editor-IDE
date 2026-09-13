import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { fileTools } from "./tool.js";
import llm from "../utils/llm.js";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const systemPrompt = `You are ZS Code Agent.

Workflow:
Understand → Inspect → Build → Validate → Fix → Validate → Complete.

Rules:
- Use tools to modify the project; do not merely explain.
- Project context supplied by the IDE is authoritative.
- Do not call get_tree when project context already contains the required structure.
- Inspect existing files before modifying them.
- Never create duplicate files.
- create_file must contain complete non-empty source code.
- update_file must contain complete updated source code.
- Preserve unrelated user code.
- For web tasks, build real working HTML/CSS/JS, not placeholders.
- After implementation call validate_web_project when available.
- If validation fails, inspect, fix, and validate again.
- Never claim completion if validation failed.
- Only make changes required by the user's request.
- Final response must summarize what was built, files changed, technologies used, and how to run it.

For a new empty project:
- Create the required files directly in the supplied root folder.
- Do not call get_tree when projectContext already says the project is empty.
`;


const max_message = 12;

const getRecentMessages = (messages = []) => {
    if (messages.length <= max_message) return messages;

    const firstUserMessage = messages.find(m => HumanMessage.isInstance(m));
    const recent = messages.slice(-max_message);

    if (firstUserMessage && !recent.includes(firstUserMessage)) {
        return [firstUserMessage, ...recent];
    }

    return recent;
};

export const graph = ({ projectId, userId, projectContext }) => {
    const tools = fileTools({ projectId, userId, projectContext });
    const model = llm.bindTools(tools);

    const agent = async (state) => {
        const allMessages = state.messages || [];
        const recentMessages = getRecentMessages(allMessages);

        const contextText=projectContext?`\n\nCURRENT PROJECT CONTEXT (provided by the IDE):\n${JSON.stringify(projectContext)}\n\nRules for this context:\n- Trust it; do not call get_tree just to reconfirm it.\n- If hasFiles=false, create required files directly under rootFolderId.\n- If hasFiles=true, use the supplied file list to decide what needs inspection.\n- Call get_tree only when this context is missing or insufficient.`:"";
        const messages=[new SystemMessage(systemPrompt+contextText),...recentMessages];

        const response = await model.invoke(messages);

        console.log(response);

        return {
            messages: [response]
        };
    };

    const toolNode = new ToolNode(tools);

    const shouldContinue = (state) => {
        const lastMessage = state.messages?.[state.messages.length - 1];

        if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
            return "tools";
        }

        return "__end__";
    };

    return new StateGraph(MessagesAnnotation)
        .addNode("agent", agent)
        .addNode("tools", toolNode)
        .addEdge("__start__", "agent")
        .addEdge("tools", "agent")
        .addConditionalEdges("agent", shouldContinue)
        .compile();
};