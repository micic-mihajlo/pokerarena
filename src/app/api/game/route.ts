import { NextRequest, NextResponse } from "next/server";
import { GameState, Player, ActionType } from "@/types/poker";
import { getLLMAction } from "@/lib/ai/llm-player";
import { processAction, ProcessActionOptions } from "@/lib/poker/engine";
import { validateAction } from "@/lib/poker/betting";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ActionRequest {
  gameState: GameState;
  apiKey?: string;
}

interface ActionResponse {
  action: ActionType;
  reasoning?: string;
  error?: string;
  newState: GameState;
}

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse | { error: string }>> {
  try {
    const body = (await request.json()) as ActionRequest;
    const { gameState, apiKey: userApiKey } = body;

    // use user-provided key or fall back to env key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!gameState) {
      return NextResponse.json({ error: "Missing game state" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 });
    }

    // get current player
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.status !== "active") {
      return NextResponse.json({ error: "No active player" }, { status: 400 });
    }

    // reconstruct Set from plain object (json serialization loses Set)
    const reconstructedState: GameState = {
      ...gameState,
      bettingRound: {
        ...gameState.bettingRound,
        actedPlayers: new Set(
          Array.isArray(gameState.bettingRound.actedPlayers)
            ? gameState.bettingRound.actedPlayers
            : []
        ),
      },
    };

    // get llm action
    const result = await getLLMAction(reconstructedState, currentPlayer, apiKey);

    // validate and apply action
    const validation = validateAction(reconstructedState, currentPlayer.id, result.action);

    if (!validation.valid) {
      // if action is invalid, default to fold or check
      const fallbackAction: ActionType =
        reconstructedState.bettingRound.currentBet === 0 ? "check" : "fold";
      const newState = processAction(reconstructedState, currentPlayer.id, fallbackAction);

      return NextResponse.json({
        action: fallbackAction,
        reasoning: `Invalid action (${result.action}): ${validation.error}. Defaulted to ${fallbackAction}.`,
        error: validation.error,
        newState: serializeState(newState),
      });
    }

    // apply action
    const newState = processAction(reconstructedState, currentPlayer.id, result.action, {
      reasoning: result.reasoning,
    });

    return NextResponse.json({
      action: result.action,
      reasoning: result.reasoning,
      error: result.error,
      newState: serializeState(newState),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// convert Set to array for json serialization
function serializeState(state: GameState): GameState {
  return {
    ...state,
    bettingRound: {
      ...state.bettingRound,
      actedPlayers: Array.from(state.bettingRound.actedPlayers) as unknown as Set<string>,
    },
  };
}

