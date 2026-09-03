import React from "react";
import { LayoutGrid, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionViewOption {
  id: string;
  label: string;
  badge?: string;
  sublabel?: string;
}

export interface SectionViewModeSwitcherProps {
  viewMode: "overall" | "focus";
  onViewModeChange: (mode: "overall" | "focus") => void;
  options: SectionViewOption[];
  selectedId: string;
  onSelectId: (id: string) => void;
  label?: string;
  className?: string;
}

export function SectionViewModeSwitcher({
  viewMode,
  onViewModeChange,
  options,
  selectedId,
  onSelectId,
  label = "Item",
  className,
}: SectionViewModeSwitcherProps) {
  const currentIndex = options.findIndex((opt) => opt.id === selectedId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const handlePrev = () => {
    if (safeIndex > 0) {
      onSelectId(options[safeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (safeIndex < options.length - 1) {
      onSelectId(options[safeIndex + 1].id);
    }
  };

  return (
    <div
      className={cn(
        "p-2.5 sm:p-3 rounded-2xl panel-slot flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-border/60",
        className,
      )}
    >
      {/* Left: View Mode Toggle Buttons (Single Focus FIRST, no eye icon) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1. Single Focus (First thing, no icon) */}
        <button
          type="button"
          onClick={() => onViewModeChange("focus")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border",
            viewMode === "focus"
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
          )}
        >
          <span>Single Focus</span>
        </button>

        {/* 2. Overall View (Second) */}
        <button
          type="button"
          onClick={() => onViewModeChange("overall")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border",
            viewMode === "overall"
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          <span>Overall View</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-md font-mono",
              viewMode === "overall"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {options.length}
          </span>
        </button>
      </div>

      {/* Right: Dropdown Selection & Steppers (when in Focus Mode) */}
      {viewMode === "focus" && (
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <span className="text-xs font-medium text-muted-foreground hidden md:inline shrink-0">
            Focus on {label}:
          </span>

          {/* Clean Select Dropdown with guaranteed right-anchored chevron */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedId}
              onChange={(e) => onSelectId(e.target.value)}
              style={{
                paddingLeft: "14px",
                paddingRight: "36px",
                paddingTop: "6px",
                paddingBottom: "6px",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
              className="w-full sm:w-auto min-w-[220px] max-w-[340px] rounded-xl text-xs font-semibold text-foreground bg-popover dark:bg-slate-900 border border-primary/30 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none cursor-pointer shadow-xs truncate"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white py-1.5">
                  {opt.label} {opt.badge ? `(${opt.badge})` : ""}
                </option>
              ))}
            </select>
            <div
              className="pointer-events-none absolute flex items-center justify-center text-primary"
              style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Previous / Next Stepper Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex <= 0}
              title="Previous"
              className="p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono font-semibold text-muted-foreground px-1.5">
              {safeIndex + 1} / {options.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={safeIndex >= options.length - 1}
              title="Next"
              className="p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
