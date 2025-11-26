import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// create openrouter client
const openrouterClient = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// wrapper that enables reasoning for all models
export function openrouter(modelId: string) {
  return openrouterClient(modelId, {
    extraBody: {
      include_reasoning: true,
    },
  });
}

// available models for the benchmark
export const AVAILABLE_MODELS = [
  { id: "openai/gpt-5.1", name: "GPT-5.1", provider: "OpenAI" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

