import { NextRequest, NextResponse } from "next/server";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  supported_parameters?: string[];
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  pricing: string; // formatted price per 1M tokens
  contextLength: number;
  popularityRank: number;
}

export async function GET(request: NextRequest) {
  try {
    // get API key from query params, header, or fall back to env
    const apiKey = request.nextUrl.searchParams.get("apiKey") ||
      request.headers.get("x-api-key") ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

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
    // openrouter returns models sorted by popularity/usage by default
    const models: ModelOption[] = data.data.map((model: OpenRouterModel, index: number) => {
      // extract provider from model id (e.g., "openai/gpt-4" -> "OpenAI")
      const [providerSlug] = model.id.split("/");
      const provider = providerSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // format pricing (convert from per-token to per-1M tokens)
      const promptPrice = parseFloat(model.pricing.prompt) * 1_000_000;
      const pricing = promptPrice > 0 ? `$${promptPrice.toFixed(2)}/1M` : "Free";

      return {
        id: model.id,
        name: model.name,
        provider,
        pricing,
        contextLength: model.context_length,
        popularityRank: index, // preserve original order (by popularity)
      };
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

