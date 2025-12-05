import { create } from "zustand";

const GATEWAY_STORAGE_KEY = "ai-gateway-api-key";
const OPENROUTER_STORAGE_KEY = "openrouter-api-key";

export interface ApiKeyStore {
  // state
  apiKey: string | null;
  isValidated: boolean;
  isValidating: boolean;
  error: string | null;
  useEnvKey: boolean; // true if using server-side env key
  provider: "gateway" | "openrouter";

  // actions
  setApiKey: (key: string, provider?: "gateway" | "openrouter") => void;
  clearApiKey: () => void;
  loadFromStorage: () => void;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  setError: (error: string | null) => void;
  setUseEnvKey: (useEnv: boolean) => void;
  setProvider: (provider: "gateway" | "openrouter") => void;
}

export const useApiKeyStore = create<ApiKeyStore>((set) => ({
  apiKey: null,
  isValidated: false,
  isValidating: false,
  error: null,
  useEnvKey: false,
  provider: "gateway",

  setApiKey: (key, provider) => {
    const resolvedProvider = provider ?? (key.startsWith("sk-or-") ? "openrouter" : "gateway");
    // persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        resolvedProvider === "openrouter" ? OPENROUTER_STORAGE_KEY : GATEWAY_STORAGE_KEY,
        key
      );
    }
    set({ apiKey: key, provider: resolvedProvider, error: null });
  },

  clearApiKey: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GATEWAY_STORAGE_KEY);
      localStorage.removeItem(OPENROUTER_STORAGE_KEY);
    }
    set({ apiKey: null, provider: "gateway", isValidated: false, error: null });
  },

  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const gatewayKey = localStorage.getItem(GATEWAY_STORAGE_KEY);
      const openrouterKey = localStorage.getItem(OPENROUTER_STORAGE_KEY);
      if (gatewayKey) {
        set({ apiKey: gatewayKey, provider: "gateway" });
      } else if (openrouterKey) {
        set({ apiKey: openrouterKey, provider: "openrouter" });
      }
    }
  },

  setValidated: (validated) => {
    set({ isValidated: validated });
  },

  setValidating: (validating) => {
    set({ isValidating: validating });
  },

  setError: (error) => {
    set({ error });
  },

  setUseEnvKey: (useEnv) => {
    set({ useEnvKey: useEnv, isValidated: useEnv, provider: "gateway" });
  },

  setProvider: (provider) => set({ provider }),
}));
