import { NextResponse } from "next/server";

export async function GET() {
  const hasEnvKey = !!(process.env.GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY);
  return NextResponse.json({ hasEnvKey });
}
