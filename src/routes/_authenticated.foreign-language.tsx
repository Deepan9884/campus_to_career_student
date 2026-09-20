import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe2,
  Loader2,
  Award,
  Files,
  BrainCircuit,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { MaterialVault } from "@/components/foreign-language/MaterialVault";
import { LanguageChat } from "@/components/foreign-language/LanguageChat";
import { CertificateVault } from "@/components/foreign-language/CertificateVault";
import { QuizListeningLab } from "@/components/foreign-language/QuizListeningLab";
import {
  LanguageProfile,
  StudyMaterial,
  LanguageChatMessage,
  getLanguageProfile,
  updateLanguageProfile,
  getStudyMaterials,
  getLanguageChatHistory,
} from "@/lib/foreign-language-api";

export const Route = createFileRoute("/_authenticated/foreign-language")({
  component: ForeignLanguageDashboard,
});

const LANGUAGES = ["Japanese", "French", "German", "Spanish", "English"];
const EXAM_LEVELS: Record<string, string[]> = {
  Japanese: ["N5", "N4", "N3", "N2", "N1"],
  French: ["A1", "A2", "B1", "B2", "C1", "C2"],
  German: ["A1", "A2", "B1", "B2", "C1", "C2"],
  Spanish: ["A1", "A2", "B1", "B2", "C1", "C2"],
  English: ["IELTS", "TOEFL", "CEFR B2", "CEFR C1"],
};
const FLUENCY = ["Beginner", "Intermediate", "Advanced"];

type Workspace = "certificate" | "study" | "practice";

function ForeignLanguageDashboard() {
  const [profile, setProfile] = useState<LanguageProfile | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [chatHistory, setChatHistory] = useState<LanguageChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace>("study");

  const fetchDashboardData = async (language?: string) => {
    try {
      const prof = await getLanguageProfile();
      setProfile(prof);
      const targetLang = language || prof.activeLanguage;
      const [mats, chat] = await Promise.all([
        getStudyMaterials(targetLang),
        getLanguageChatHistory(targetLang),
      ]);
      setMaterials(mats);
      setChatHistory(chat.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLanguageChange = async (lang: string) => {
    if (!profile) return;
    const newTarget = EXAM_LEVELS[lang]?.[0] || "General";
    setProfile({ ...profile, activeLanguage: lang, targetExam: newTarget });
    setMaterials([]);
    setChatHistory([]);
    try {
      await updateLanguageProfile({ activeLanguage: lang, targetExam: newTarget });
      await fetchDashboardData(lang);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = async (exam: string) => {
    if (!profile) return;
    setProfile({ ...profile, targetExam: exam });
    try {
      await updateLanguageProfile({ targetExam: exam });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFluencyChange = async (level: string) => {
    if (!profile) return;
    setProfile({ ...profile, fluencyLevel: level });
    try {
      await updateLanguageProfile({ fluencyLevel: level });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const activeMaterialCount = materials.filter((m) => m.isActive).length;
  const availableExams = EXAM_LEVELS[profile.activeLanguage] || ["General"];

  const banners: {
    id: Workspace;
    title: string;
    desc: string;
    icon: typeof Award;
    meta: string;
    glow: "amber" | "violet" | "mint";
  }[] = [
    {
      id: "certificate",
      title: "1 · Upload Your Certificate",
      desc: "Save JLPT / DELF / Goethe proof with exam, issuer & score.",
      icon: Award,
      meta: `${profile.activeLanguage} • ${profile.targetExam}`,
      glow: "amber",
    },
    {
      id: "study",
      title: "2 · Upload & Ask AI",
      desc: "Drop PDF / DOCX notes, then quiz the chatbot on them.",
      icon: Files,
      meta: `${activeMaterialCount} active file${activeMaterialCount === 1 ? "" : "s"}`,
      glow: "violet",
    },
    {
      id: "practice",
      title: "3 · Quiz & Listening",
      desc: "AI quiz, quiz-from-PDF & futuristic exam audio lab.",
      icon: BrainCircuit,
      meta: `${profile.targetExam} exam mode`,
      glow: "mint",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
          <Globe2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">Foreign Language Lab</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Certificates, study vault + AI chat, and exam-style quiz & listening.
          </p>
        </div>
      </div>

      {/* ── TOP HORIZONTAL STRIP: language · exam · level ── */}
      <GlassCard className="p-4 md:p-5" variant="strong">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3.5">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" /> Language
              </span>
              <select
                value={profile.activeLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Exam / Level
              </span>
              <select
                value={profile.targetExam}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {availableExams.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5" /> Your level
              </span>
              <select
                value={profile.fluencyLevel}
                onChange={(e) => handleFluencyChange(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {FLUENCY.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground lg:pb-3 shrink-0">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary">
              {profile.stats.quizzesTaken} quizzes
            </span>
            <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary">
              {profile.stats.materialsUploaded} uploads
            </span>
          </div>
        </div>
      </GlassCard>

      {/* ── THREE BANNERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {banners.map((b) => {
          const active = workspace === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setWorkspace(b.id)}
              className={`text-left rounded-2xl border p-5 transition-all group relative overflow-hidden ${
                active
                  ? "border-primary/60 shadow-[0_0_30px_rgba(167,139,250,0.25)] bg-primary/5"
                  : "border-border/70 hover:border-primary/40 hover:-translate-y-0.5"
              } glass`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    b.glow === "amber"
                      ? "bg-amber-400/15 border-amber-300/30"
                      : b.glow === "mint"
                        ? "bg-emerald-400/15 border-emerald-300/30"
                        : "bg-primary/15 border-primary/30"
                  }`}
                >
                  <b.icon
                    className={`w-6 h-6 ${
                      b.glow === "amber" ? "text-amber-300" : b.glow === "mint" ? "text-emerald-300" : "text-primary"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[15px] leading-snug">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted/40 border border-border/60">
                      {b.meta}
                    </span>
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                      {active ? "Open below ✓" : "Open"} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── WORKSPACE ── */}
      <div className="animate-slide-up-fade" key={workspace + profile.activeLanguage}>
        {workspace === "certificate" && (
          <div className="max-w-3xl mx-auto">
            <CertificateVault language={profile.activeLanguage} examLevels={availableExams} />
          </div>
        )}

        {workspace === "study" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 min-h-[540px]">
              <MaterialVault
                materials={materials}
                language={profile.activeLanguage}
                onMaterialsChanged={() => fetchDashboardData(profile.activeLanguage)}
              />
            </div>
            <div className="lg:col-span-3">
              <LanguageChat
                language={profile.activeLanguage}
                history={chatHistory}
                onMessageSent={(msg) => setChatHistory((prev) => [...prev, msg])}
                activeMaterialCount={activeMaterialCount}
              />
            </div>
          </div>
        )}

        {workspace === "practice" && (
          <div className="max-w-3xl mx-auto">
            <QuizListeningLab
              language={profile.activeLanguage}
              targetExam={profile.targetExam}
              activeMaterialCount={activeMaterialCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
