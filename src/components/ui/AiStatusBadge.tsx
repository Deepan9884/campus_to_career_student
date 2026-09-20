import React from "react";
import { Sparkles, Bot, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AiStatusBadgeProps {
  aiProvider?: "gemini" | "nemotron" | "smart-fallback" | string;
  isFallback?: boolean;
  model?: string;
  className?: string;
  compact?: boolean;
}

export function AiStatusBadge({
  aiProvider,
  isFallback = false,
  model,
  className,
  compact = false,
}: AiStatusBadgeProps) {
  const isSmartFallback = isFallback || aiProvider === "smart-fallback";
  const isNemotron = aiProvider === "nemotron" || (model && model.toLowerCase().includes("nemotron"));

  if (isSmartFallback) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25 transition-all shadow-2xs select-none",
          className
        )}
        title="Smart Contextual Assistant: Verified algorithmic fallback active during peak AI service capacity."
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse shrink-0" />
        <span>{compact ? "Smart Assist" : "Smart Contextual AI"}</span>
      </div>
    );
  }

  if (isNemotron) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25 transition-all shadow-2xs select-none",
          className
        )}
        title={`NVIDIA Nemotron (${model || "30B Lightning"}): High-throughput enterprise LLM.`}
      >
        <Zap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>{compact ? "Nemotron" : "NVIDIA Nemotron Live"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/25 transition-all shadow-2xs select-none",
        className
      )}
      title={`Gemini Live Engine (${model || "Gemini Flash"}): Live Google GenAI response.`}
    >
      <Bot className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
      <span>{compact ? "Gemini Live" : "Live Gemini AI"}</span>
    </div>
  );
}
