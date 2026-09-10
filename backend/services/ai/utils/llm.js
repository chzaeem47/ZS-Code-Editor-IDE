import { ChatOpenRouter } from "@langchain/openrouter";

const model = new ChatOpenRouter({
  model: "anthropic/claude-sonnet-4.5",
  temperature: 0,
  maxTokens: 1024,

});