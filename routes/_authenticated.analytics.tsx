import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/Score";
import { Trophy, Flame, FileText, Mic, Github, Sparkles, Loader2, BookOpen } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAnalyticsOverview, getWeeklyReport, type WeeklyReportResponse } from "@/lib/analytics-api";
import { toast } from "sonner";
import type { AnalyticsResponse } from "@/types/analytics";

function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await getWeeklyReport();
      setReport(res);
      toast.success("AI Weekly Report generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate weekly report.");
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <GlassCard className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-[color:var(--color-primary)]/20 bg-gradient-to-r from-[color:var(--color-primary)]/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[color:var(--color-primary)]/20 grid place-items-center shrink-0">
            <Sparkles className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
          <div>
            <h3 className="font-bold text-white">Generate AI Weekly Report</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Get a personalized summary of your progress and actionable tips for next week.</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate Report ✨
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="strong" className="mb-6 border-[color:var(--color-primary)]/30 shadow-lg shadow-[color:var(--color-primary)]/10">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[15px] grid place-items-center">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Your AI Weekly Report</h3>
            <p className="text-slate-300 mt-1 leading-relaxed text-sm">{report.summary}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Items for Next Week</h4>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                  <div className="h-5 w-5 rounded-full bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] grid place-items-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Progress & Analytics — Campus to Career AI" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

function AnalyticsPage() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: getAnalyticsOverview,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-white/5 border border-white/10 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/5 border border-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          <div className="h-72 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const resumeTrend = data?.resumeTrend || [];
  const interviewTrend = data?.interviewTrend || [];
  const skillRadar = data?.skillRadar || [];
  const featureUsage = data?.featureUsage || [];
  const achievements = data?.achievements || [];
  const activities = data?.activities || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Progress & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track every step of your prep journey.</p>
      </div>

      <WeeklyReportCard />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard
          label="Readiness"
          value={overview?.readiness || 0}
          suffix="%"
          icon={Sparkles}
        />
        <OverviewCard label="Days on Platform" value={overview?.daysOnPlatform || 0} icon={Flame} />
        <OverviewCard
          label="Features Used"
          value={overview?.featuresUsed || 0}
          suffix={`/${overview?.totalFeatures || 5}`}
          icon={Trophy}
        />
        <OverviewCard
          label="Skills Added"
          value={featureUsage.find((f) => f.name === "Skills")?.value || 0}
          icon={Flame}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-3">Resume Score Trend</h3>
          <div className="h-60">
            {resumeTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Upload resumes to see your score trend
              </div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={resumeTrend}>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Interview Performance</h3>
          <div className="h-60">
            {interviewTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Complete interviews to see your performance
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={interviewTrend}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {interviewTrend.map((d, i) => (
                      <Cell key={i} fill={d.type === "Technical" ? "#3B82F6" : "#8B5CF6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Skill Progress</h3>
          <div className="h-60">
            {skillRadar.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Run a gap analysis to see skill radar
              </div>
            ) : (
              <ResponsiveContainer>
                <RadarChart data={skillRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" stroke="#94A3B8" fontSize={11} />
                  <PolarRadiusAxis stroke="#94A3B8" fontSize={10} />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Feature Adoption</h3>
          <div className="h-60">
            {featureUsage.every((f) => f.value === 0) ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Start using features to see adoption
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={featureUsage.filter((f) => f.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {featureUsage
                      .filter((f) => f.value > 0)
                      .map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-3">Activity Timeline</h3>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a, i) => (
                <li
                  key={`${a.type}-${i}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5"
                >
                  <div className="h-9 w-9 rounded-lg glass grid place-items-center shrink-0">
                    {a.type === "resume" ? (
                      <FileText className="h-4 w-4" />
                    ) : a.type === "interview" ? (
                      <Mic className="h-4 w-4" />
                    ) : a.type === "project" ? (
                      <Github className="h-4 w-4" />
                    ) : a.type === "roadmap" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.date}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">AI Insights</h3>
          <InsightsList data={data ?? null} />
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-4">Your Achievements</h3>
        {achievements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No achievements yet. Start using features!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((a) => (
              <div
                key={a.name}
                className={`glass rounded-xl p-3 text-center ${!a.earned ? "opacity-60" : ""}`}
              >
                <div
                  className={`h-12 w-12 mx-auto rounded-full grid place-items-center ${a.earned ? "btn-gradient" : "bg-white/5"}`}
                >
                  <Trophy className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold mt-2 truncate">{a.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{a.tier}</p>
                {!a.earned && (
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full btn-gradient" style={{ width: `${a.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function InsightsList({ data }: { data: AnalyticsResponse | null }) {
  if (!data) return null;

  const insights: string[] = [];
  const { overview, resumeTrend, interviewTrend, skillRadar, achievements } = data;

  if (resumeTrend.length >= 2) {
    const first = resumeTrend[0].score;
    const last = resumeTrend[resumeTrend.length - 1].score;
    const diff = last - first;
    if (diff > 0) insights.push(`Resume ATS score improved ${diff} points!`);
  }

  const earnedCount = achievements.filter((a) => a.earned).length;
  if (earnedCount > 0)
    insights.push(`You've earned ${earnedCount} achievement${earnedCount > 1 ? "s" : ""}.`);

  const weakestSkill = skillRadar.reduce(
    (min, s) => (s.current < min.current ? s : min),
    skillRadar[0],
  );
  if (weakestSkill && weakestSkill.current < 50) {
    insights.push(`Focus on ${weakestSkill.skill} to improve your readiness.`);
  }

  if (interviewTrend.length >= 2) {
    const last = interviewTrend[interviewTrend.length - 1].score;
    if (last >= 80) insights.push(`Great interview performance: ${last}/100!`);
  }

  if (overview.featuresUsed >= 4) {
    insights.push("You're using most platform features — keep it up!");
  }

  if (insights.length === 0) {
    insights.push("Complete more assessments to see personalized insights.");
  }

  return (
    <ul className="space-y-3 text-sm">
      {insights.map((text, i) => (
        <Insight key={i} text={text} />
      ))}
    </ul>
  );
}

function OverviewCard({
  label,
  value,
  suffix = "",
  icon: Icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: typeof Trophy;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mt-3">{label}</p>
      <p className="text-2xl font-bold mt-1">
        <AnimatedCounter value={value} />
        {suffix}
      </p>
    </GlassCard>
  );
}

function Insight({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 p-3 glass rounded-xl">
      <Sparkles className="h-4 w-4 text-[color:var(--color-accent)] shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}
