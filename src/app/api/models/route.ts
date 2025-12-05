import { NextRequest, NextResponse } from "next/server";
import { createGateway } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  pricing: string;
  contextLength: number;
  popularityRank: number;
}

export async function GET(request: NextRequest) {
  try {
    // get API key from query params, header, or fall back to env
    const apiKey =
      request.nextUrl.searchParams.get("apiKey") ||
      request.headers.get("x-api-key") ||
      process.env.GATEWAY_API_KEY ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    const useOpenRouter = apiKey.startsWith("sk-or-");

    if (useOpenRouter) {
      // OpenRouter: fetch models from their API
      const response = await fetch(
        "https://openrouter.ai/api/v1/models?supported_parameters=include_reasoning",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const models: ModelOption[] = data.data.map(
        (
          model: {
            id: string;
            name?: string;
            pricing?: { prompt?: string };
            context_length?: number;
          },
          index: number
        ) => {
          const modelId = model.id;
          const [providerSlug] = modelId.split("/");
          const provider = providerSlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          const pricing = model.pricing?.prompt
            ? `$${(parseFloat(model.pricing.prompt) * 1_000_000).toFixed(2)}/1M`
            : "Free";

          return {
            id: modelId,
            name: model.name || modelId,
            provider,
            pricing,
            contextLength: model.context_length || 128_000,
            popularityRank: index,
          };
        }
      );

      return NextResponse.json({ models });
    } else {
      // Vercel AI Gateway: use SDK method
      const gateway = createGateway({ apiKey });
      const availableModels = await gateway.getAvailableModels();

      const models: ModelOption[] = availableModels.models.map((model, index) => {
        const modelId = model.id;
        const [providerSlug] = modelId.split("/");
        const provider = providerSlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Format pricing if available
        let pricing = "Gateway managed";
        if (model.pricing && model.pricing.input != null) {
          const inputValue = typeof model.pricing.input === 'string'
            ? parseFloat(model.pricing.input)
            : model.pricing.input;
          if (!isNaN(inputValue)) {
            pricing = `$${(inputValue * 1_000_000).toFixed(2)}/1M`;
          }
        }

        return {
          id: modelId,
          name: model.name || modelId,
          provider,
          pricing,
          contextLength: 128_000, // Gateway doesn't expose this
          popularityRank: index,
        };
      });

      return NextResponse.json({ models });
    }
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

