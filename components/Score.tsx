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
  return <>{n}</>;
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
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    score >= 70
      ? "var(--color-success)"
      : score >= 40
        ? "var(--color-warning)"
        : "var(--color-destructive)";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={score >= 40 && score < 70 ? color : `url(#g-${size})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{
            strokeDashoffset: c - (c * score) / 100,
            transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold">
          <AnimatedCounter value={score} />
          <span className="text-base text-muted-foreground">%</span>
        </div>
        {label && <div className="text-xs text-muted-foreground mt-1">{label}</div>}
      </div>
    </div>
  );
}

export function MiniRing({
  value,
  label,
  color = "#3B82F6",
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
            stroke="rgba(255,255,255,0.08)"
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
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold">
          <AnimatedCounter value={value} />%
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
