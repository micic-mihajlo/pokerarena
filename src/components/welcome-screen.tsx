"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiKeyStore } from "@/stores/api-key-store";
import { motion } from "motion/react";
import { Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";

// Animated playing card component
function FloatingCard({
  suit,
  rank,
  className,
  delay = 0
}: {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
  className?: string;
  delay?: number;
}) {
  const isRed = suit === "♥" || suit === "♦";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -10 }}
      animate={{
        opacity: [0, 0.8, 0.8, 0],
        y: [20, -20, -40, -60],
        rotate: [-10, 5, -5, 10],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <div className="w-16 h-24 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center border border-slate-200">
        <span className={`text-lg font-bold ${isRed ? "text-red-500" : "text-slate-900"}`}>
          {rank}
        </span>
        <span className={`text-2xl ${isRed ? "text-red-500" : "text-slate-900"}`}>
          {suit}
        </span>
      </div>
    </motion.div>
  );
}

// Floating chip component
function FloatingChip({
  color,
  className,
  delay = 0
}: {
  color: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.7, 0.7, 0],
        scale: [0.5, 1, 1, 0.8],
        y: [0, -30, -50, -80],
      }}
      transition={{
        duration: 10,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <div
        className={`w-10 h-10 rounded-full border-4 border-dashed border-white/50 shadow-lg ${color}`}
        style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}
      />
    </motion.div>
  );
}

export function WelcomeScreen() {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { setApiKey, setValidated, setValidating, setError, isValidating, error } = useApiKeyStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyInput.trim()) {
      setError("Please enter your API key");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyInput.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setApiKey(keyInput.trim());
        setValidated(true);
      } else {
        setError(data.error || "Invalid API key");
      }
    } catch {
      setError("Failed to validate key. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Poker table felt background */}
      <div className="absolute inset-0">
        {/* Dark green felt base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f12] via-[#0a1a0e] to-[#050d07]" />

        {/* Subtle felt texture pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Table spotlight effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-emerald-900/30 via-transparent to-transparent rounded-full blur-3xl" />

        {/* Corner shadows for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
      </div>

      {/* Floating cards */}
      <FloatingCard suit="♠" rank="A" className="top-[10%] left-[10%]" delay={0} />
      <FloatingCard suit="♥" rank="K" className="top-[15%] right-[15%]" delay={2} />
      <FloatingCard suit="♦" rank="Q" className="bottom-[20%] left-[8%]" delay={4} />
      <FloatingCard suit="♣" rank="J" className="bottom-[25%] right-[12%]" delay={6} />
      <FloatingCard suit="♥" rank="10" className="top-[40%] left-[5%]" delay={3} />
      <FloatingCard suit="♠" rank="A" className="top-[35%] right-[8%]" delay={5} />

      {/* Floating chips */}
      <FloatingChip color="bg-red-600" className="top-[20%] left-[20%]" delay={1} />
      <FloatingChip color="bg-blue-600" className="top-[30%] right-[20%]" delay={3} />
      <FloatingChip color="bg-emerald-600" className="bottom-[30%] left-[15%]" delay={5} />
      <FloatingChip color="bg-amber-500" className="bottom-[15%] right-[18%]" delay={2} />
      <FloatingChip color="bg-purple-600" className="top-[50%] right-[5%]" delay={4} />

      {/* Card suit decorations */}
      <div className="absolute top-8 left-8 text-6xl text-white/5 font-serif">♠</div>
      <div className="absolute top-8 right-8 text-6xl text-red-500/10 font-serif">♥</div>
      <div className="absolute bottom-8 left-8 text-6xl text-red-500/10 font-serif">♦</div>
      <div className="absolute bottom-8 right-8 text-6xl text-white/5 font-serif">♣</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Logo section */}
        <div className="text-center mb-10">
          {/* Card-style logo */}
          <motion.div
            className="relative mx-auto mb-6"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-24 h-32 mx-auto bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center border-2 border-slate-200 relative overflow-hidden">
              {/* Card shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-100" />
              <span className="text-emerald-600 text-4xl font-bold relative z-10">P</span>
              <span className="text-emerald-600 text-3xl relative z-10">♠</span>
            </div>
            {/* Card shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-md" />
          </motion.div>

          <motion.h1
            className="text-5xl font-bold tracking-tight mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">Poker</span>
            <span className="text-white">Arena</span>
          </motion.h1>

          <motion.p
            className="text-slate-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Watch AI battle it out in Texas Hold&apos;em
          </motion.p>
        </div>

        {/* Main card - styled like a poker card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 rounded-2xl blur-xl" />

          <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-emerald-900/50 p-8 shadow-2xl">
            {/* Corner decorations */}
            <div className="absolute top-3 left-4 text-emerald-500/20 text-xl font-bold">♠ ♥</div>
            <div className="absolute top-3 right-4 text-emerald-500/20 text-xl font-bold">♦ ♣</div>

            <h2 className="text-white font-semibold text-xl mb-2 text-center">Enter the Arena</h2>
            <p className="text-slate-400 text-sm mb-8 text-center">
              Bring your Vercel AI Gateway key to watch LLMs compete (OpenRouter keys still work).
              <br />
              <span className="text-slate-500">Your key stays in your browser.</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400">♦</span>
                  Vercel AI Gateway Key
                </label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder="your-gateway-key or sk-or-..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="bg-black/40 border-emerald-900/50 text-white placeholder:text-slate-600 pr-10 h-12 focus:border-emerald-500 focus:ring-emerald-500/20"
                    disabled={isValidating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-2"
                >
                  <span className="text-red-400">♠</span>
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={isValidating || !keyInput.trim()}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Shuffling the deck...
                  </>
                ) : (
                  <>
                    <span className="mr-2">♠</span>
                    Deal Me In
                    <span className="ml-2">♠</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/60">
              <p className="text-slate-500 text-sm text-center">
                Need an API key?{" "}
                <a
                  href="https://vercel.com/ai-gateway"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
                >
                  Get one from Vercel AI Gateway
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Bottom corner decorations */}
            <div className="absolute bottom-3 left-4 text-emerald-500/20 text-xl font-bold rotate-180">♠ ♥</div>
            <div className="absolute bottom-3 right-4 text-emerald-500/20 text-xl font-bold rotate-180">♦ ♣</div>
          </div>
        </motion.div>

        {/* Features - styled like poker chips */}
        <motion.div
          className="mt-10 flex justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: "♠", label: "GPT-5, Claude, Gemini", sublabel: "Top AI Models" },
            { icon: "♥", label: "See Every Decision", sublabel: "AI Reasoning" },
            { icon: "♦", label: "Real-time Action", sublabel: "Live Games" },
          ].map((feature, i) => (
            <div key={i} className="text-center group">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 transition-colors">
                <span className={`text-2xl ${i === 1 ? "text-red-400" : "text-white"}`}>
                  {feature.icon}
                </span>
              </div>
              <p className="text-white text-xs font-medium">{feature.sublabel}</p>
              <p className="text-slate-500 text-[10px]">{feature.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
