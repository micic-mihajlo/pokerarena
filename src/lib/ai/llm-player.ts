import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { GameState, Player, ActionType } from "@/types/poker";
import { getValidActions } from "@/lib/poker/engine";
import { POKER_SYSTEM_PROMPT, formatGameStatePrompt } from "./prompts";
import { parseResponse } from "./response-parser";

export interface LLMActionResult {
  action: ActionType;
  reasoning?: string;
  rawResponse?: string;
  error?: string;
}

// get action from llm player
export async function getLLMAction(
  state: GameState,
  player: Player
): Promise<LLMActionResult> {
  const validActions = getValidActions(state);
  const prompt = formatGameStatePrompt(state, player, validActions);

  try {
    const { text } = await generateText({
      model: openrouter(player.model),
      system: POKER_SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 256,
      temperature: 0.7,
    });

    const parsed = parseResponse(text, validActions);

    return {
      action: parsed.action,
      reasoning: parsed.reasoning,
      rawResponse: text,
    };
  } catch (error) {
    console.error(`Error getting action from ${player.name}:`, error);

    // fallback to safe action on error
    const fallbackAction: ActionType = validActions.canCheck
      ? "check"
      : validActions.canCall
      ? "call"
      : "fold";

    return {
      action: fallbackAction,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

