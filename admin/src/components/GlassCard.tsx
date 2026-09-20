import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong" | "subtle" | "interactive" | "liquid" | "card" | "elite" | "hero" | "kpi";
  hover?: boolean;
  glow?: "violet" | "rose" | "mint" | "amber" | "none";
}

const GLOW_CLASS: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  violet: "shadow-[0_4px_20px_rgba(99,102,241,0.15)]",
  rose: "shadow-[0_4px_20px_rgba(244,63,94,0.12)]",
  mint: "shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
  amber: "shadow-[0_4px_20px_rgba(245,158,11,0.12)]",
  none: "",
};

export function GlassCard({
  children,
  className = "",
  variant = "default",
  hover = false,
  glow = "none",
  ...props
}: GlassCardProps) {
  let baseClass = "glass rounded-2xl p-6 shadow-xl";

  if (variant === "strong") {
    baseClass = "glass-strong rounded-2xl p-6 shadow-2xl";
  } else if (variant === "subtle") {
    baseClass = "glass rounded-xl p-4";
  } else if (variant === "interactive") {
    baseClass = "liquid-glass-card rounded-2xl p-6 cursor-pointer card-hover-lift";
  } else if (variant === "liquid") {
    baseClass = "liquid-glass rounded-2xl p-6";
  } else if (variant === "card") {
    baseClass = "liquid-glass-card rounded-2xl p-6";
  } else if (variant === "elite") {
    baseClass = "elite-panel rounded-2xl p-6";
  } else if (variant === "hero") {
    baseClass = "elite-panel hero-card-shimmer rounded-3xl p-7 relative overflow-hidden";
  } else if (variant === "kpi") {
    baseClass = "kpi-card kpi-card-violet rounded-2xl";
  }

  const glowClass = GLOW_CLASS[glow] || "";

  return (
    <div className={`${baseClass} ${hover ? "card-hover-lift cursor-pointer" : ""} ${glowClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
