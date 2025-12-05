import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { valid: false, error: "API key is required" },
        { status: 400 }
      );
    }

    const useOpenRouter = apiKey.startsWith("sk-or-");

    // validate by calling provider models endpoint
    const response = await fetch(
      useOpenRouter ? "https://openrouter.ai/api/v1/models" : "https://ai-gateway.vercel.sh/v1/models",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (response.status === 401) {
      return NextResponse.json(
        {
          valid: false,
          error: useOpenRouter
            ? "Invalid API key. Please check your OpenRouter key."
            : "Invalid API key. Please check your Vercel AI Gateway key.",
        },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        {
          valid: false,
          error: useOpenRouter
            ? "API key does not have permission. Check your OpenRouter account."
            : "API key does not have permission. Check your Vercel AI Gateway settings.",
        },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, error: `Gateway error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validating API key:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate API key. Please try again." },
      { status: 500 }
    );
  }
}
