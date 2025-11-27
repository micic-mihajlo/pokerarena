"use client";

import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "@/stores/game-store";
import { LLMPlayer } from "@/types/poker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Settings, Plus, X, Search, Check, ChevronLeft } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [players, setPlayers] = useState<LLMPlayer[]>(config.players);
  const [startingChips, setStartingChips] = useState(config.startingChips);
  const [smallBlind, setSmallBlind] = useState(config.smallBlind);
  const [bigBlind, setBigBlind] = useState(config.bigBlind);
  const [view, setView] = useState<ViewState>("main");
  const [searchQuery, setSearchQuery] = useState("");

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
    setLoadingModels(true);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (data.models) setModels(data.models);
    } catch (e) {
      console.error("Failed to fetch models:", e);
    } finally {
      setLoadingModels(false);
    }
  };

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const q = searchQuery.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
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

  const providerColors: Record<string, string> = {
    openai: "text-emerald-400",
    anthropic: "text-orange-400",
    google: "text-blue-400",
    meta: "text-indigo-400",
    mistralai: "text-purple-400",
    deepseek: "text-cyan-400",
    "x-ai": "text-neutral-300",
    qwen: "text-rose-400",
  };

  const getProviderColor = (provider: string) =>
    providerColors[provider.toLowerCase().replace(" ", "")] || "text-slate-400";

  // model picker view
  const renderModelPicker = (onSelect: (model: ModelOption) => void) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button
          onClick={() => {
            setView("main");
            setSearchQuery("");
          }}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm focus:outline-none focus:border-slate-600"
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loadingModels ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No models found</div>
        ) : (
          <div className="p-2">
            {filteredModels.map((model, i) => (
              <button
                key={model.id}
                onClick={() => onSelect(model)}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {model.name}
                    </span>
                    {i < 5 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                        TOP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-xs", getProviderColor(model.provider))}>
                      {model.provider}
                    </span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{model.pricing}</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // main settings view
  const renderMain = () => (
    <>
      <DialogHeader className="px-5 py-4 border-b border-slate-800">
        <DialogTitle className="text-base font-semibold">Settings</DialogTitle>
      </DialogHeader>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* players */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Players ({players.length}/6)
              </label>
            </div>

            <div className="space-y-1.5">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 group"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setView({ type: "edit-player", playerId: player.id })}
                  >
                    <div className="text-sm font-medium truncate">{player.name}</div>
                    <div className="text-xs text-slate-500 truncate">{player.model}</div>
                  </div>
                  {players.length > 2 && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {players.length < 6 && (
                <button
                  onClick={() => setView("add-player")}
                  disabled={loadingModels}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-800/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Player</span>
                </button>
              )}
            </div>
          </section>

          {/* chips */}
          <section>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-3">
              Starting Chips
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[500, 1000, 2000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  onClick={() => setStartingChips(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    startingChips === v
                      ? "bg-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {v.toLocaleString()}
                </button>
              ))}
              <input
                type="number"
                value={startingChips}
                onChange={(e) => setStartingChips(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-20 px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm text-center focus:outline-none focus:border-slate-600"
              />
            </div>
          </section>

          {/* blinds */}
          <section>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-3">
              Blinds (Small / Big)
            </label>
            <div className="flex flex-wrap gap-1.5">
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
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    smallBlind === s && bigBlind === b
                      ? "bg-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {s}/{b}
                </button>
              ))}
              <div className="flex items-center gap-1 text-slate-500">
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm text-center focus:outline-none focus:border-slate-600"
                />
                <span>/</span>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-14 px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm text-center focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={players.length < 2 || players.some((p) => !p.model)}
        >
          <Check className="w-4 h-4 mr-1.5" />
          Apply
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2" disabled={disabled || isRunning}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white p-0 gap-0 flex flex-col max-h-[85vh]">
        {view === "main" && renderMain()}
        {view === "add-player" && renderModelPicker(selectModelForNewPlayer)}
        {typeof view === "object" &&
          view.type === "edit-player" &&
          renderModelPicker((model) => selectModelForExistingPlayer(view.playerId, model))}
      </DialogContent>
    </Dialog>
  );
}
