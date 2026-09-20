import { useState } from "react";
import { useAuth } from "@/stores";
import { toast } from "sonner";
import {
  Trophy,
  Target,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Zap,
  GraduationCap,
  Code2,
  Flame,
  Check,
  Plus,
  X,
  Palette,
  Server,
  Layers,
  BarChart2,
  Bot,
  Cloud,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import confetti from "canvas-confetti";

interface OnboardingWizardProps {
  open?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
}

const PRESET_ROLES = [
  { title: "Software Engineer", icon: Code2 },
  { title: "Frontend Developer", icon: Palette },
  { title: "Backend Engineer", icon: Server },
  { title: "Full Stack Developer", icon: Layers },
  { title: "Data Analyst", icon: BarChart2 },
  { title: "Product Manager", icon: Briefcase },
  { title: "AI/ML Engineer", icon: Bot },
  { title: "DevOps Engineer", icon: Cloud },
];

const EXPERIENCE_LEVELS = [
  {
    id: "Beginner",
    label: "Beginner / Student",
    subLabel: "0-1 Years Experience",
    badge: "Foundational",
    desc: "Focus on fundamentals, core data structures, and step-by-step interview hints.",
  },
  {
    id: "Intermediate",
    label: "Intermediate / Associate",
    subLabel: "1-3 Years Experience",
    badge: "Standard",
    desc: "Balanced practical problems, standard technical rounds, and live code evaluations.",
  },
  {
    id: "Advanced",
    label: "Advanced / Senior",
    subLabel: "3+ Years Experience",
    badge: "Advanced",
    desc: "Deep system design, architectural trade-offs, edge-case optimization & hard scenarios.",
  },
] as const;

const DAILY_GOALS = [
  { count: 1, label: "Casual", icon: Target, desc: "1 problem / day" },
  { count: 3, label: "Recommended", icon: Flame, desc: "3 problems / day" },
  { count: 5, label: "Intensive", icon: Zap, desc: "5 problems / day" },
  { count: 10, label: "Hardcore", icon: Trophy, desc: "10 problems / day" },
];

const DEFAULT_TECH_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "AWS",
  "System Design",
  "Data Structures",
  "Git & GitHub",
];

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const { user, updateUser } = useAuth();
  const [internalOpen, setInternalOpen] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [role, setRole] = useState(user?.profile?.targetRole || user?.targetRole || "");
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Advanced">(
    (user?.preferences?.aiDifficulty as "Beginner" | "Intermediate" | "Advanced") || "Intermediate"
  );
  const [dailyGoal, setDailyGoal] = useState<number>(user?.preferences?.dailyGoalProblems || 3);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "JavaScript", "SQL", "Data Structures"]);
  const [customSkill, setCustomSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen && (!user?.profile?.targetRole && !user?.targetRole);

  if (!isOpen) return null;

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const handleToggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    if (!customSkill.trim()) return;
    if (!selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
    }
    setCustomSkill("");
  };

  async function handleComplete() {
    if (!role.trim()) {
      toast.error("Please specify a target role");
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        profile: { ...user?.profile, targetRole: role.trim() },
        targetRole: role.trim(),
        experience: experienceLevel,
        preferences: {
          ...user?.preferences,
          theme: user?.preferences?.theme || "dark",
          notifyOn: user?.preferences?.notifyOn || ["interviews", "milestones"],
          aiDifficulty: experienceLevel,
          dailyGoalProblems: dailyGoal,
        },
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Profile setup complete! Welcome to Campus to Career AI");
      
      setInternalOpen(false);
      onClose?.();
      onComplete?.();
    } catch {
      toast.error("Failed to save onboarding setup. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-card text-card-foreground border border-border shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-6 border-b border-border relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="Skip Onboarding"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
              Profile Setup • Step {step} of 3
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Welcome to Campus to Career AI
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
            Let's personalize your AI interview practice, skill gap roadmaps, and career readiness telemetry.
          </p>
        </div>

        {/* Body Content per Step */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: TARGET ROLE / DESIGNATION */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center shrink-0 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">What is your target designation?</h3>
                  <p className="text-xs text-muted-foreground">Select or type the target position you are preparing for.</p>
                </div>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Frontend Developer..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 hover:bg-secondary/70 focus:bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && role.trim()) setStep(2);
                  }}
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Popular Career Tracks:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_ROLES.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => setRole(preset.title)}
                      className={`text-xs p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        role === preset.title
                          ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                          : "bg-secondary/40 hover:bg-secondary border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      <preset.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium truncate sm:whitespace-normal">{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE LEVEL & DAILY GOAL */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/25 grid place-items-center shrink-0 text-purple-600 dark:text-purple-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Experience & Interview Level</h3>
                  <p className="text-xs text-muted-foreground">Tailor AI interview difficulty and daily practice intensity.</p>
                </div>
              </div>

              {/* Difficulty Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Difficulty Track:</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
                        experienceLevel === lvl.id
                          ? "bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                          : "bg-secondary/40 hover:bg-secondary border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{lvl.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono font-medium">
                            {lvl.subLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{lvl.desc}</p>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {experienceLevel === lvl.id ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-border" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Problem Goal */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" /> Daily Problem Target:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DAILY_GOALS.map((goal) => {
                    const GoalIcon = goal.icon;
                    const isSelected = dailyGoal === goal.count;
                    return (
                      <button
                        key={goal.count}
                        type="button"
                        onClick={() => setDailyGoal(goal.count)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500/30"
                            : "bg-secondary/40 hover:bg-secondary border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GoalIcon className={`h-4 w-4 ${isSelected ? "text-amber-500" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-foreground">{goal.desc}</span>
                        <span className="text-[10px] opacity-75">{goal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TECH STACK & KEY SKILLS */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 grid place-items-center shrink-0 text-emerald-600 dark:text-emerald-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Key Tech Stack & Focus Skills</h3>
                  <p className="text-xs text-muted-foreground">Select technologies to calibrate your skill gap matrix.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto p-1">
                {DEFAULT_TECH_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                          : "bg-secondary/40 hover:bg-secondary border-border text-foreground"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Skill Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. GraphQL, Kubernetes)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="flex-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkill.trim()}
                  className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground disabled:opacity-50 transition border border-border cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Selected: <strong className="text-foreground">{selectedSkills.length} skills</strong></span>
                <span className="text-primary">Target Role: <strong className="text-foreground">{role || "Not set"}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 bg-secondary/30 border-t border-border flex justify-between items-center rounded-b-2xl">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s < step || (s === 2 && role.trim())) {
                    setStep(s as 1 | 2 | 3);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-2 bg-border"
                }`}
                title={`Step ${s}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (!role.trim()) {
                    toast.error("Please enter or select a target designation");
                    return;
                  }
                  setStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
                disabled={!role.trim()}
                className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50 transition shadow-md cursor-pointer"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving || !role.trim()}
                className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50 transition shadow-md shadow-primary/25 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Complete & Start Practice</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

