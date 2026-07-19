import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Mic,
  Github,
  Target,
  BookOpen,
  Trophy,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { getActivity } from "@/lib/activity-api";
import type { ActivityLogEntry, ActivityModule } from "@/types/activity";

const MODULE_ICONS: Record<ActivityModule, React.ComponentType<{ className?: string }>> = {
  resume: FileText,
  interview: Mic,
  github: Github,
  skill_gap: Target,
  roadmap: BookOpen,
  quiz: Trophy,
};

function getModuleColor(module: ActivityModule): string {
  switch (module) {
    case "resume":
      return "text-blue-400";
    case "interview":
      return "text-purple-400";
    case "github":
      return "text-muted-foreground";
    case "skill_gap":
      return "text-green-400";
    case "roadmap":
      return "text-indigo-400";
    case "quiz":
      return "text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivity({ limit: 5 })
      .then((res) => {
        if (!cancelled) setActivities(res.activities);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load activity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{error}</span>
        </div>
      </GlassCard>
    );
  }

  if (activities.length === 0) {
    return (
      <GlassCard className="p-6">
        <p className="text-center text-muted-foreground text-sm py-4">
          No activity yet — complete a module to see it here
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-white/5">
        {activities.map((activity) => {
          const Icon = MODULE_ICONS[activity.module] || Target;
          const color = getModuleColor(activity.module);
          return (
            <li key={activity._id} className="px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className={`h-8 w-8 rounded-lg bg-white/5 grid place-items-center shrink-0 ${color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{activity.summary}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {activity.module.replace("_", " ")} ·{" "}
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}