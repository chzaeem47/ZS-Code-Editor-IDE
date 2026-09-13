import { ChatGoogle } from "@langchain/google";

const llm = new ChatGoogle({
    model: "gemini-3.5-flash",
    temperature: 0,
    maxRetries: 2,
});

export default llm;