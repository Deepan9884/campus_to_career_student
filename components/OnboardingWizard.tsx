import { useState } from "react";
import { useAuth } from "@/stores";
import { toast } from "sonner";
import { Sparkles, Target, Briefcase, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function OnboardingWizard() {
  const { user, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  // If user is already onboarded (has a target role), don't show
  if (user?.profile?.targetRole || user?.targetRole) {
    return null;
  }

  if (!isOpen) return null;

  async function handleComplete() {
    if (!role.trim()) {
      toast.error("Please enter a target role");
      return;
    }
    
    setSaving(true);
    try {
      await updateUser({ profile: { ...user?.profile, targetRole: role } });
      toast.success("Profile updated! Welcome to CareerForge AI.");
      setIsOpen(false);
    } catch {
      toast.error("Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <GlassCard variant="strong" className="w-full max-w-md overflow-hidden relative shadow-2xl p-0">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 p-6 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="h-24 w-24 -mr-6 -mt-6 transform rotate-12" />
          </div>
          <h2 className="text-2xl font-bold text-white relative z-10">Welcome to CareerForge</h2>
          <p className="text-sm text-indigo-200 mt-1 relative z-10">Let's set up your profile to personalize your AI prep.</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full btn-gradient grid place-items-center shrink-0">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">What is your target role?</h3>
                  <p className="text-xs text-muted-foreground">This helps AI tailor your roadmap and interview questions.</p>
                </div>
              </div>
              
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Data Scientist..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && role) handleComplete();
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {["Software Engineer", "Frontend Developer", "Data Analyst", "Product Manager"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRole(preset)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
          <div className="flex gap-1">
            <div className="h-1.5 w-8 bg-indigo-500 rounded-full" />
            <div className="h-1.5 w-2 bg-white/20 rounded-full" />
            <div className="h-1.5 w-2 bg-white/20 rounded-full" />
          </div>
          
          <button
            onClick={handleComplete}
            disabled={saving || !role}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Setup"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
