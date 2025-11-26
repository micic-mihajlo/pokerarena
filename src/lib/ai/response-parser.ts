import { ActionType, ValidActions } from "@/types/poker";

export interface LLMResponse {
  action: ActionType;
  reasoning?: string;
}

// parse llm response to extract action
export function parseResponse(text: string, validActions: ValidActions): LLMResponse {
  // try to extract json from response
  let parsed: { action?: string; reasoning?: string } | null = null;

  try {
    // try direct parse
    parsed = JSON.parse(text.trim());
  } catch {
    // try to find json in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // fallback below
      }
    }
  }

  if (parsed && parsed.action) {
    const action = normalizeAction(parsed.action, validActions);
    if (action) {
      return { action, reasoning: parsed.reasoning };
    }
  }

  // fallback: look for action keywords in text
  const lowerText = text.toLowerCase();

  if (lowerText.includes("fold")) {
    return { action: "fold", reasoning: "Parsed from text" };
  }
  if (lowerText.includes("raise") && validActions.canRaise) {
    return { action: "raise", reasoning: "Parsed from text" };
  }
  if (lowerText.includes("bet") && validActions.canBet) {
    return { action: "bet", reasoning: "Parsed from text" };
  }
  if (lowerText.includes("call") && validActions.canCall) {
    return { action: "call", reasoning: "Parsed from text" };
  }
  if (lowerText.includes("check") && validActions.canCheck) {
    return { action: "check", reasoning: "Parsed from text" };
  }

  // default fallback based on valid actions
  return getDefaultAction(validActions);
}

// normalize action string to valid action type
function normalizeAction(action: string, validActions: ValidActions): ActionType | null {
  const normalized = action.toLowerCase().trim();

  switch (normalized) {
    case "fold":
      return "fold";
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

// get default action when parsing fails
function getDefaultAction(validActions: ValidActions): LLMResponse {
  // prefer passive actions
  if (validActions.canCheck) {
    return { action: "check", reasoning: "Default: check when possible" };
  }
  if (validActions.canCall && validActions.callAmount <= 10) {
    return { action: "call", reasoning: "Default: call small bet" };
  }
  return { action: "fold", reasoning: "Default: fold when uncertain" };
}

