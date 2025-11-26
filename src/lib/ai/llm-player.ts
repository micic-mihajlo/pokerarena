import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { GameState, Player, ActionType, ValidActions } from "@/types/poker";
import { getValidActions } from "@/lib/poker/engine";
import { POKER_SYSTEM_PROMPT, formatGameStatePrompt } from "./prompts";

export interface LLMActionResult {
  action: ActionType;
  reasoning?: string;
  error?: string;
}

// extract action and reasoning from response text
function parseResponse(text: string, validActions: ValidActions): { action: ActionType; reasoning?: string } {
  // find the last JSON object in the text (reasoning comes before)
  const jsonMatch = text.match(/\{[^{}]*"action"\s*:\s*"(\w+)"[^{}]*\}/);
  
  let action: ActionType = "fold";
  let reasoning: string | undefined;
  
  if (jsonMatch) {
    const actionMatch = jsonMatch[0].match(/"action"\s*:\s*"(\w+)"/);
    if (actionMatch) {
      action = actionMatch[1].toLowerCase() as ActionType;
    }
    
    // everything before the JSON is the reasoning
    const jsonIndex = text.lastIndexOf(jsonMatch[0]);
    if (jsonIndex > 0) {
      reasoning = text.substring(0, jsonIndex).trim();
      // clean up code block markers
      reasoning = reasoning.replace(/^```(?:json)?\s*/gi, "").replace(/\s*```$/gi, "").trim();
    }
  } else {
    // fallback: look for action keywords
    const lowerText = text.toLowerCase();
    if (lowerText.includes("fold") && validActions.canFold) action = "fold";
    else if (lowerText.includes("raise") && validActions.canRaise) action = "raise";
    else if (lowerText.includes("bet") && validActions.canBet) action = "bet";
    else if (lowerText.includes("call") && validActions.canCall) action = "call";
    else if (lowerText.includes("check") && validActions.canCheck) action = "check";
    
    // use full text as reasoning (cleaned)
    reasoning = text.replace(/^```(?:json)?\s*/gi, "").replace(/\s*```$/gi, "").trim();
  }
  
  // clean empty/garbage reasoning
  if (reasoning && (reasoning.length < 10 || reasoning === "json")) {
    reasoning = undefined;
  }
  
  // validate action
  if (
    (action === "fold" && !validActions.canFold && !validActions.canCheck) ||
    (action === "check" && !validActions.canCheck) ||
    (action === "call" && !validActions.canCall) ||
    (action === "bet" && !validActions.canBet) ||
    (action === "raise" && !validActions.canRaise)
  ) {
    action = validActions.canCheck ? "check" : validActions.canCall ? "call" : "fold";
  }
  
  return { action, reasoning };
}

// extract native reasoning from SDK reasoning field
function extractNativeReasoning(reasoning: unknown): string | undefined {
  if (!reasoning) return undefined;
  if (typeof reasoning === "string") return reasoning;
  
  // handle array format: [{type:"reasoning", text:"..."}]
  if (Array.isArray(reasoning)) {
    const texts = reasoning
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.summary) return Array.isArray(item.summary) ? item.summary.join(" ") : item.summary;
        return "";
      })
      .filter(Boolean);
    return texts.length > 0 ? texts.join("\n") : undefined;
  }
  
  // handle object format
  if (typeof reasoning === "object" && reasoning !== null) {
    const r = reasoning as Record<string, unknown>;
    if ("text" in r && typeof r.text === "string") return r.text;
    if ("summary" in r) {
      const summary = r.summary;
      if (typeof summary === "string") return summary;
      if (Array.isArray(summary)) {
        return summary.map((s) => (typeof s === "string" ? s : s?.text || "")).filter(Boolean).join(" ");
      }
    }
  }
  return undefined;
}

// get action from llm player
export async function getLLMAction(
  state: GameState,
  player: Player
): Promise<LLMActionResult> {
  const validActions = getValidActions(state);
  let prompt = formatGameStatePrompt(state, player, validActions);
  
  // gemini doesn't respect include_reasoning, so ask explicitly
  if (player.model.includes("gemini")) {
    prompt += "\n\nFirst briefly explain your reasoning, then give your action as JSON.";
  }

  try {
    const result = await generateText({
      model: openrouter(player.model),
      system: POKER_SYSTEM_PROMPT,
      prompt,
      maxTokens: 1024,
      temperature: 0.7,
    });

    const { text, reasoning } = result;
    
    // parse action and inline reasoning from text
    const parsed = parseResponse(text, validActions);
    
    // check for SDK reasoning field (OpenAI reasoning models)
    const nativeReasoning = extractNativeReasoning(reasoning);
    
    // prefer: native reasoning > inline reasoning from text
    const finalReasoning = nativeReasoning || parsed.reasoning;

    return {
      action: parsed.action,
      reasoning: finalReasoning,
    };
  } catch (error) {
    console.error(`Error getting action from ${player.name}:`, error);

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

