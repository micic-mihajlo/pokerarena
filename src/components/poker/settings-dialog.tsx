"use client";

import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "@/stores/game-store";
import { useApiKeyStore } from "@/stores/api-key-store";
import { LLMPlayer } from "@/types/poker";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Settings, Plus, X, Search, ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  pricing: string;
  contextLength: number;
  popularityRank: number;
}

type ViewState = "main" | "add-player" | { type: "edit-player"; playerId: string };

export function SettingsDialog({ disabled }: { disabled?: boolean }) {
  const { config, setConfig, initGame, isRunning } = useGameStore();
  const { apiKey, clearApiKey } = useApiKeyStore();
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [players, setPlayers] = useState<LLMPlayer[]>(config.players);
  const [startingChips, setStartingChips] = useState(config.startingChips);
  const [smallBlind, setSmallBlind] = useState(config.smallBlind);
  const [bigBlind, setBigBlind] = useState(config.bigBlind);
  const [view, setView] = useState<ViewState>("main");
  const [searchQuery, setSearchQuery] = useState("");

  const maskedApiKey = apiKey
    ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
    : "";

  useEffect(() => {
    if (open) {
      setPlayers(config.players);
      setStartingChips(config.startingChips);
      setSmallBlind(config.smallBlind);
      setBigBlind(config.bigBlind);
      setView("main");
      setSearchQuery("");
    }
  }, [open, config.players, config.startingChips, config.smallBlind, config.bigBlind]);

  useEffect(() => {
    if (open && models.length === 0) {
      fetchModels();
    }
  }, [open, models.length]);

  const fetchModels = async () => {
    if (!apiKey) return;
    setLoadingModels(true);
    try {
      const res = await fetch("/api/models", {
        headers: { "x-api-key": apiKey },
      });
      const data = await res.json();
      if (data.models) setModels(data.models);
    } catch (e) {
      console.error("Failed to fetch models:", e);
    } finally {
      setLoadingModels(false);
    }
  };

  const MAX_DISPLAY = 25;

  const filteredModels = useMemo(() => {
    let result = models;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = models.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
      );
    }

    // Limit display to prevent overflow
    return result.slice(0, MAX_DISPLAY);
  }, [models, searchQuery]);

  const totalMatchingModels = useMemo(() => {
    if (!searchQuery.trim()) return models.length;
    const q = searchQuery.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    ).length;
  }, [models, searchQuery]);

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((p) => p.id !== id));
  };

  const selectModelForNewPlayer = (model: ModelOption) => {
    if (players.length >= 6) return;
    setPlayers([
      ...players,
      {
        id: `player-${Date.now()}`,
        name: model.name,
        model: model.id,
      },
    ]);
    setView("main");
    setSearchQuery("");
  };

  const selectModelForExistingPlayer = (playerId: string, model: ModelOption) => {
    setPlayers(
      players.map((p) =>
        p.id === playerId ? { ...p, model: model.id, name: model.name } : p
      )
    );
    setView("main");
    setSearchQuery("");
  };

  const handleSave = () => {
    setConfig({ players, startingChips, smallBlind, bigBlind });
    initGame();
    setOpen(false);
  };

  // Model picker view
  const renderModelPicker = (onSelect: (model: ModelOption) => void) => (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setView("main");
              setSearchQuery("");
            }}
            className="p-1.5 -ml-1.5 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white">Select Model</span>
        </div>
        {!loadingModels && (
          <span className="text-xs text-slate-500">
            {totalMatchingModels > MAX_DISPLAY
              ? `${MAX_DISPLAY} of ${totalMatchingModels}`
              : totalMatchingModels}
          </span>
        )}
      </div>

      <div className="px-5 py-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loadingModels ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mr-2" />
            Loading models...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No models found
          </div>
        ) : (
          <div className="py-1">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model)}
                className="w-full text-left px-5 py-2.5 hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{model.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {model.provider} · {model.pricing}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 ml-3" />
              </button>
            ))}
            {totalMatchingModels > MAX_DISPLAY && (
              <div className="px-5 py-3 text-xs text-slate-500 text-center border-t border-slate-800/50">
                Search to find more models
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Main settings view
  const renderMain = () => (
    <>
      <div className="px-5 py-4 border-b border-slate-800/80">
        <h2 className="text-base font-semibold text-white">Settings</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Players */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Players
              </label>
              <span className="text-xs text-slate-500">{players.length}/6</span>
            </div>

            <div className="space-y-1">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span className="w-5 text-xs text-slate-500 tabular-nums">{index + 1}.</span>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setView({ type: "edit-player", playerId: player.id })}
                  >
                    <div className="text-sm text-white truncate">{player.name}</div>
                  </div>
                  {players.length > 2 && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {players.length < 6 && (
                <button
                  onClick={() => setView("add-player")}
                  disabled={loadingModels}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
                >
                  <Plus className="w-4 h-4 ml-0.5" />
                  <span className="text-sm">Add player</span>
                </button>
              )}
            </div>
          </section>

          {/* Starting Chips */}
          <section>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-3">
              Starting Chips
            </label>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  onClick={() => setStartingChips(v)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-colors",
                    startingChips === v
                      ? "bg-white text-slate-900 font-medium"
                      : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </section>

          {/* Blinds */}
          <section>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-3">
              Blinds
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                [5, 10],
                [10, 20],
                [25, 50],
                [50, 100],
                [100, 200],
              ].map(([s, b]) => (
                <button
                  key={`${s}-${b}`}
                  onClick={() => {
                    setSmallBlind(s);
                    setBigBlind(b);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-colors",
                    smallBlind === s && bigBlind === b
                      ? "bg-white text-slate-900 font-medium"
                      : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {s}/{b}
                </button>
              ))}
            </div>
          </section>

          {/* API Key */}
          <section className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  API Key
                </div>
                <div className="text-sm font-mono text-slate-300">{maskedApiKey}</div>
              </div>
              <button
                onClick={() => {
                  clearApiKey();
                  setOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800/80">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="text-slate-400"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={players.length < 2 || players.some((p) => !p.model)}
          className="bg-white text-slate-900 hover:bg-slate-200"
        >
          Apply
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-400 hover:text-white"
          disabled={disabled || isRunning}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm bg-slate-900 border-slate-800 text-white p-0 gap-0 flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">Game Settings</DialogTitle>
        {view === "main" && renderMain()}
        {view === "add-player" && renderModelPicker(selectModelForNewPlayer)}
        {typeof view === "object" &&
          view.type === "edit-player" &&
          renderModelPicker((model) => selectModelForExistingPlayer(view.playerId, model))}
      </DialogContent>
    </Dialog>
  );
}
