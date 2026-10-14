import { ChatGoogle } from "@langchain/google";

const llm = new ChatGoogle({
    model: "gemini-3.7-flash",
    temperature: 1.0,
    maxRetries: 2,
});

export default llm;