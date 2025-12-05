import { create } from "zustand";

const STORAGE_KEY = "openrouter-api-key";

export interface ApiKeyStore {
  // state
  apiKey: string | null;
  isValidated: boolean;
  isValidating: boolean;
  error: string | null;
  useEnvKey: boolean; // true if using server-side env key

  // actions
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  loadFromStorage: () => void;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  setError: (error: string | null) => void;
  setUseEnvKey: (useEnv: boolean) => void;
}

export const useApiKeyStore = create<ApiKeyStore>((set) => ({
  apiKey: null,
  isValidated: false,
  isValidating: false,
  error: null,
  useEnvKey: false,

  setApiKey: (key) => {
    // persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, key);
    }
    set({ apiKey: key, error: null });
  },

  clearApiKey: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ apiKey: null, isValidated: false, error: null });
  },

  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ apiKey: stored });
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
    set({ useEnvKey: useEnv, isValidated: useEnv });
  },
}));
