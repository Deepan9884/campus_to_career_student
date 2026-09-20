import React from "react";

export function ScoreRing({
  score = 0,
  size = 64,
  stroke = 6,
  label,
}: {
  score?: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const safeScore = isNaN(Number(score)) ? 0 : Math.max(0, Math.min(100, Math.round(Number(score))));
  const radius = Math.max(1, (size - stroke) / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  let color = "#ef4444"; // red
  if (safeScore >= 70) color = "#10b981"; // emerald
  else if (safeScore >= 40) color = "#3b82f6"; // blue

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-300/80 dark:stroke-white/10"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress circle arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(offset) ? 0 : offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Crisp text centered */}
        <span
          className={`absolute font-black tracking-tight text-slate-900 dark:text-white ${
            size <= 42 ? "text-[10px]" : size <= 52 ? "text-[11px]" : "text-xs"
          }`}
        >
          {safeScore}%
        </span>
      </div>
      {label && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}
