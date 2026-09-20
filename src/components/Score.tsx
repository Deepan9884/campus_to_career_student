import { useEffect, useState } from "react";

export function AnimatedCounter({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="tabular-nums font-bold">{n}</span>;
}

export function ScoreRing({
  score,
  size = 180,
  stroke = 14,
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // Proportional dynamic typography scaling
  const valueFontSize = Math.max(16, Math.round(size * (label ? 0.26 : 0.32)));
  const percentFontSize = Math.max(10, Math.round(valueFontSize * 0.48));
  const labelFontSize = Math.max(9, Math.min(12, Math.round(size * 0.11)));

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-ember-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className="text-foreground/10"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={safeScore >= 70 ? "#4CAF7D" : safeScore < 40 ? "#E5484D" : `url(#g-ember-${size})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{
            strokeDashoffset: c - (c * safeScore) / 100,
            transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1 pointer-events-none select-none">
        <div
          className="font-extrabold text-foreground tabular-nums tracking-tight flex items-baseline justify-center leading-none"
          style={{ fontSize: `${valueFontSize}px` }}
        >
          <AnimatedCounter value={safeScore} />
          <span
            className="text-muted-foreground font-semibold ml-0.5"
            style={{ fontSize: `${percentFontSize}px` }}
          >
            %
          </span>
        </div>
        {label && (
          <div
            className="text-muted-foreground font-semibold tracking-normal mt-0.5 leading-tight truncate max-w-[85%]"
            style={{ fontSize: `${labelFontSize}px` }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniRing({
  value,
  label,
  color = "#6366F1",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const size = 96,
    stroke = 9,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="currentColor"
            className="text-foreground/10"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            style={{
              strokeDashoffset: c - (c * value) / 100,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">
          <AnimatedCounter value={value} />%
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}
