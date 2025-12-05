import { createGateway } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// create vercel ai gateway client with custom API key
export function createGatewayClient(apiKey: string) {
  const client = createGateway({
    apiKey,
  });

  return function aiGateway(modelId: string) {
    return client(modelId);
  };
}

// default gateway client using env variable
const defaultGatewayClient = createGatewayClient(process.env.GATEWAY_API_KEY || "");

export function aiGateway(modelId: string) {
  return defaultGatewayClient(modelId);
}

// create openrouter client with custom API key
export function createOpenRouterClient(apiKey: string) {
  const client = createOpenRouter({
    apiKey,
  });

  // wrapper that enables reasoning for all models
  return function openrouter(modelId: string) {
    return client(modelId, {
      extraBody: {
        include_reasoning: true,
      },
    });
  };
}

// default client using env variable (for backwards compatibility)
const defaultClient = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export function openrouter(modelId: string) {
  return defaultClient(modelId, {
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

