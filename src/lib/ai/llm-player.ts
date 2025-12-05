import { generateText } from "ai";
import { openrouter, createOpenRouterClient } from "@/lib/openrouter";
import { GameState, Player, ActionType, ValidActions } from "@/types/poker";
import { getValidActions } from "@/lib/poker/engine";
import { POKER_SYSTEM_PROMPT, POKER_SYSTEM_PROMPT_WITH_REASONING, formatGameStatePrompt } from "./prompts";

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

// check if reasoning is redacted/useless (OpenAI sometimes returns [REDACTED])
function isRedactedReasoning(text: string): boolean {
  if (!text || text.length < 20) return true;
  const lower = text.toLowerCase();
  // check for redaction patterns
  if (lower.includes("[redacted]") || lower.includes("[image #")) return true;
  // check if it's mostly redacted (more than 50% is redaction markers)
  const redactionPattern = /\[(?:redacted|image #\d+)\]/gi;
  const matches = text.match(redactionPattern);
  if (matches && matches.join("").length > text.length * 0.3) return true;
  return false;
}

// extract native reasoning from SDK reasoning field
function extractNativeReasoning(reasoning: unknown): string | undefined {
  if (!reasoning) return undefined;
  if (typeof reasoning === "string") {
    return isRedactedReasoning(reasoning) ? undefined : reasoning;
  }

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
    const joined = texts.length > 0 ? texts.join("\n") : undefined;
    return joined && isRedactedReasoning(joined) ? undefined : joined;
  }

  // handle object format
  if (typeof reasoning === "object" && reasoning !== null) {
    const r = reasoning as Record<string, unknown>;
    if ("text" in r && typeof r.text === "string") {
      return isRedactedReasoning(r.text) ? undefined : r.text;
    }
    if ("summary" in r) {
      const summary = r.summary;
      if (typeof summary === "string") {
        return isRedactedReasoning(summary) ? undefined : summary;
      }
      if (Array.isArray(summary)) {
        const joined = summary.map((s) => (typeof s === "string" ? s : s?.text || "")).filter(Boolean).join(" ");
        return isRedactedReasoning(joined) ? undefined : joined;
      }
    }
  }
  return undefined;
}

// get action from llm player
export async function getLLMAction(
  state: GameState,
  player: Player,
  apiKey?: string
): Promise<LLMActionResult> {
  const validActions = getValidActions(state);
  let prompt = formatGameStatePrompt(state, player, validActions);

  // some models don't provide accessible reasoning, so we need to use
  // a different system prompt that forces inline reasoning
  // gemini: doesn't respect include_reasoning
  // openai reasoning models (o1, o3, gpt-5): return [REDACTED] encrypted reasoning
  const needsExplicitReasoning =
    player.model.includes("gemini") ||
    player.model.includes("o1-") ||
    player.model.includes("o3-") ||
    player.model.includes("gpt-5");

  const systemPrompt = needsExplicitReasoning
    ? POKER_SYSTEM_PROMPT_WITH_REASONING
    : POKER_SYSTEM_PROMPT;

  // use custom API key if provided, otherwise fall back to default
  const modelFn = apiKey ? createOpenRouterClient(apiKey) : openrouter;

  try {
    const result = await generateText({
      model: modelFn(player.model),
      system: systemPrompt,
      prompt,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    const { text, reasoning } = result;

    // DEBUG: log what we're getting from the model
    console.log(`[${player.model}] text:`, JSON.stringify(text));
    console.log(`[${player.model}] reasoning:`, JSON.stringify(reasoning));

    // parse action and inline reasoning from text
    const parsed = parseResponse(text, validActions);

    // check for SDK reasoning field (OpenAI reasoning models)
    const nativeReasoning = extractNativeReasoning(reasoning);

    console.log(`[${player.model}] parsed.reasoning:`, parsed.reasoning?.substring(0, 100));
    console.log(`[${player.model}] nativeReasoning:`, nativeReasoning?.substring(0, 100));

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

