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

    // basic format validation
    if (!apiKey.startsWith("sk-or-")) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key format. OpenRouter keys start with 'sk-or-'" },
        { status: 400 }
      );
    }

    // validate by calling OpenRouter models endpoint
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.status === 401) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key. Please check your OpenRouter API key." },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        { valid: false, error: "API key does not have permission. Check your OpenRouter account." },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, error: `OpenRouter error: ${response.status}` },
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
