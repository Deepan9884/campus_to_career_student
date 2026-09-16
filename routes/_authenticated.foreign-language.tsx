import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe2, FileText, GraduationCap, Loader2, PlayCircle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { MaterialVault } from "@/components/foreign-language/MaterialVault";
import { LanguageChat } from "@/components/foreign-language/LanguageChat";
import {
  LanguageProfile,
  StudyMaterial,
  LanguageChatMessage,
  getLanguageProfile,
  updateLanguageProfile,
  getStudyMaterials,
  getLanguageChatHistory,
  generateLanguageQuiz,
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

function ForeignLanguageDashboard() {
  const [profile, setProfile] = useState<LanguageProfile | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [chatHistory, setChatHistory] = useState<LanguageChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

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
    
    // Reset target exam to first available if language changes
    const newTarget = EXAM_LEVELS[lang]?.[0] || "General";
    
    // Optimistic update for instant UI reaction
    setProfile({ ...profile, activeLanguage: lang, targetExam: newTarget });
    setMaterials([]); // Clear materials to show it's switching
    setChatHistory([]); // Clear chat history to show it's switching
    
    try {
      await updateLanguageProfile({ activeLanguage: lang, targetExam: newTarget });
      await fetchDashboardData(lang);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = async (exam: string) => {
    if (!profile) return;
    
    // Optimistic update
    setProfile({ ...profile, targetExam: exam });
    
    try {
      await updateLanguageProfile({ targetExam: exam });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartQuiz = async () => {
    if (!profile) return;
    setIsGeneratingQuiz(true);
    try {
      // Generate quiz questions based on active materials
      const questions = await generateLanguageQuiz(profile.activeLanguage, profile.targetExam);
      
      // Store in session storage and navigate to quiz runner
      sessionStorage.setItem("cf_fl_quiz", JSON.stringify({
        language: profile.activeLanguage,
        level: profile.targetExam,
        questions
      }));
      // In a real app we would navigate to a dedicated quiz runner view.
      // For now, we alert success to prove generation works.
      alert(`Successfully generated a ${questions.length}-question practice quiz for ${profile.activeLanguage} ${profile.targetExam}! Check console for data.`);
      console.log(questions);
      
    } catch (err: any) {
      alert("Failed to generate quiz: " + err.message);
    } finally {
      setIsGeneratingQuiz(false);
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

  const activeMaterialCount = materials.filter(m => m.isActive).length;
  const availableExams = EXAM_LEVELS[profile.activeLanguage] || ["General"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-primary" />
            Foreign Language Lab
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload study materials, chat with AI, and prepare for certifications.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Switcher */}
          <select 
            value={profile.activeLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="glass-input rounded-xl px-4 py-2 text-sm font-medium outline-none bg-background/50"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Target Exam Switcher */}
          <select 
            value={profile.targetExam}
            onChange={(e) => handleExamChange(e.target.value)}
            className="glass-input rounded-xl px-4 py-2 text-sm font-medium outline-none bg-background/50"
          >
            {availableExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>

          <button
            onClick={handleStartQuiz}
            disabled={isGeneratingQuiz || activeMaterialCount === 0}
            className="btn-gradient rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-primary/25 disabled:opacity-50"
          >
            {isGeneratingQuiz ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Take {profile.targetExam} Practice Quiz
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Material Vault */}
        <div className="lg:col-span-1 h-[600px]">
          <MaterialVault 
            materials={materials} 
            language={profile.activeLanguage}
            onMaterialsChanged={() => fetchDashboardData(profile.activeLanguage)}
          />
        </div>

        {/* Right Column: RAG Chat */}
        <div className="lg:col-span-2">
          <LanguageChat 
            language={profile.activeLanguage}
            history={chatHistory}
            onMessageSent={(msg) => setChatHistory(prev => [...prev, msg])}
            activeMaterialCount={activeMaterialCount}
          />
        </div>
      </div>
    </div>
  );
}
