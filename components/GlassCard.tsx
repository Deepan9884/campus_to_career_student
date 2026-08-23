import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "strong" | "liquid" | "card";
  hover?: boolean;
  glow?: "violet" | "rose" | "mint" | "amber" | "none";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  hover = false,
  glow = "none",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variant === "strong" && "glass-strong",
        variant === "liquid" && "liquid-glass",
        variant === "card" && "liquid-glass-card",
        variant === "default" && "glass",
        hover && "card-hover-lift cursor-pointer",
        glow === "violet" && "shadow-[0_0_30px_rgba(167,139,250,0.25)]",
        glow === "rose" && "shadow-[0_0_30px_rgba(249,168,212,0.22)]",
        glow === "mint" && "shadow-[0_0_30px_rgba(134,239,172,0.22)]",
        glow === "amber" && "shadow-[0_0_30px_rgba(253,230,138,0.20)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
