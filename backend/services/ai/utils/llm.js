import { ChatOpenRouter } from "@langchain/openrouter";

const llm=new ChatOpenRouter({
    model:"deepseek/deepseek-v4.1-flash",
    temperature:0,
    maxTokens:700,
    route:"fallback",
    model_kwargs:{
        models:[
            "deepseek/deepseek-v4.1-flash",
            "openai/gpt-5.6-luna"
        ]
    },
    openrouter_provider:{
        sort:"throughput",
        allow_fallbacks:true
    }
});

export default llm;
