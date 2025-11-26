import { ActionType, ValidActions } from "@/types/poker";

export interface LLMResponse {
  action: ActionType;
  reasoning?: string;
}

// parse llm response to extract action
export function parseResponse(text: string, validActions: ValidActions): LLMResponse {
  console.log("Raw LLM response:", text);
  
  // try multiple json extraction methods
  let parsed: { action?: string; reasoning?: string } | null = null;

  // method 1: direct parse
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    // continue to other methods
  }

  // method 2: find json with greedy match (handles nested braces better)
  if (!parsed) {
    const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // continue
      }
    }
  }

  // method 3: find json between code blocks
  if (!parsed) {
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(codeBlockMatch[1]);
      } catch {
        // continue
      }
    }
  }

  // method 4: extract action and reasoning separately with regex
  if (!parsed) {
    const actionMatch = text.match(/"action"\s*:\s*"(\w+)"/i);
    // more robust reasoning extraction - handles escaped quotes and multiline
    const reasoningMatch = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    
    if (actionMatch) {
      parsed = {
        action: actionMatch[1],
        reasoning: reasoningMatch ? reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : undefined,
      };
    }
  }

  // method 5: try to extract reasoning even if we already have parsed action
  if (parsed && parsed.action && !parsed.reasoning) {
    const reasoningMatch = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (reasoningMatch) {
      parsed.reasoning = reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
    }
  }

  // if we have a parsed action, validate and return
  if (parsed && parsed.action) {
    const action = normalizeAction(parsed.action, validActions);
    if (action) {
      const reasoning = parsed.reasoning || extractReasoningFromText(text);
      return { action, reasoning };
    }
  }

  // fallback: look for action keywords in text
  const lowerText = text.toLowerCase();
  const reasoning = extractReasoningFromText(text);

  // check in priority order
  if (lowerText.includes("fold") && validActions.canFold) {
    return { action: "fold", reasoning };
  }
  if ((lowerText.includes("raise") || lowerText.includes("re-raise")) && validActions.canRaise) {
    return { action: "raise", reasoning };
  }
  if (lowerText.includes("bet") && !lowerText.includes("bet to call") && validActions.canBet) {
    return { action: "bet", reasoning };
  }
  if (lowerText.includes("call") && validActions.canCall) {
    return { action: "call", reasoning };
  }
  if (lowerText.includes("check") && validActions.canCheck) {
    return { action: "check", reasoning };
  }

  // if we extracted reasoning but no action, use it with default
  if (reasoning && reasoning.length > 20) {
    return getDefaultAction(validActions, reasoning);
  }

  // last resort - pick safest action
  return getDefaultAction(validActions, undefined);
}

// extract reasoning from text outside of json
function extractReasoningFromText(text: string): string | undefined {
  // try robust regex first - handles escaped quotes
  const reasoningMatch = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
  if (reasoningMatch && reasoningMatch[1].length > 5) {
    return reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
  }

  // try to parse json and extract
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reasoning && parsed.reasoning.length > 5) {
        return parsed.reasoning;
      }
    } catch {
      // json parse failed, continue
    }
  }

  // extract text outside json/code blocks as last resort
  const withoutJson = text.replace(/```[\s\S]*?```/g, "").replace(/\{[\s\S]*?\}/g, "").trim();
  
  if (withoutJson.length > 20) {
    return withoutJson
      .replace(/^[\s\n]+|[\s\n]+$/g, "")
      .replace(/\n+/g, " ")
      .substring(0, 300);
  }

  return undefined;
}

// normalize action string
function normalizeAction(action: string, validActions: ValidActions): ActionType | null {
  const normalized = action.toLowerCase().trim();

  switch (normalized) {
    case "fold":
      return validActions.canFold || validActions.canCheck ? "fold" : null;
    case "check":
      return validActions.canCheck ? "check" : null;
    case "call":
      return validActions.canCall ? "call" : null;
    case "bet":
      return validActions.canBet ? "bet" : null;
    case "raise":
      return validActions.canRaise ? "raise" : null;
    default:
      return null;
  }
}

// default action when parsing fails
function getDefaultAction(validActions: ValidActions, reasoning?: string): LLMResponse {
  if (validActions.canCheck) {
    return { action: "check", reasoning };
  }
  if (validActions.canCall) {
    return { action: "call", reasoning };
  }
  return { action: "fold", reasoning };
}
