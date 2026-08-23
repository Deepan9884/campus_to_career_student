import { useState } from "react";
import { CheckCircle2, Circle, ListChecks, ChevronDown, ChevronUp, Map } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { SkillGap } from "@/types/skills";

interface SubTopicProgressProps {
  gap: SkillGap;
  roadmapId?: string | null;
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "passed":
      return "bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]";
    case "in_progress":
      return "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]";
    default:
      return "bg-white/10 text-muted-foreground";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

export function SubTopicProgress({ gap, roadmapId }: SubTopicProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasSubTopics = gap.subTopics && gap.subTopics.length > 0;

  if (!hasSubTopics) {
    return (
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Gap Progress</p>
          <span className="text-xs text-muted-foreground">0%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-slate-600/40" style={{ width: "0%" }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          No sub-topics yet — generate a learning roadmap to break this skill down.
        </p>
        <button
          onClick={() => navigate({ to: "/roadmap" })}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-[color:var(--color-primary)] hover:underline py-1"
        >
          <Map className="h-3 w-3" />
          Go to Roadmap
        </button>
      </div>
    );
  }

  const gapPercent = gap.gapPercent ?? 0;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition"
      >
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ListChecks className="h-3 w-3" />
          Sub-topics ({gap.subTopics.length})
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[color:var(--color-success)]">
            {gapPercent}%
          </span>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[color:var(--color-success)] transition-all duration-500"
          style={{ width: `${gapPercent}%` }}
        />
      </div>
      {expanded && (
        <div className="mt-3 space-y-1.5">
          {gap.subTopics.map((st) => (
            <div
              key={st.subTopicId}
              className="flex items-center justify-between gap-2 p-2 rounded-lg glass"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {st.status === "passed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-success)] shrink-0" />
                ) : st.status === "in_progress" ? (
                  <Circle className="h-3.5 w-3.5 text-[color:var(--color-warning)] shrink-0 fill-[color:var(--color-warning)]" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-500 shrink-0" />
                )}
                <span className="text-xs text-muted-foreground truncate">{st.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground">{st.weightPercent}%</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusBadgeClasses(st.status)}`}
                >
                  {getStatusLabel(st.status)}
                </span>
              </div>
            </div>
          ))}
          {roadmapId && (
            <button
              onClick={() => navigate({ to: "/roadmap" })}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-[color:var(--color-primary)] hover:underline py-1"
            >
              <Map className="h-3 w-3" />
              Open in Roadmap
            </button>
          )}
        </div>
      )}
    </div>
  );
}