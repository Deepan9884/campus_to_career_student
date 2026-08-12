import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Code, Play, CheckCircle2, ArrowRight, Star, RefreshCw, Terminal, Layers, Activity } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores";

export interface FeaturePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureId: string;
  featureTitle: string;
  featureSubtitle: string;
  imagePath: string;
}

export const FeaturePreviewModal: React.FC<FeaturePreviewModalProps> = ({
  isOpen,
  onClose,
  featureId,
  featureTitle,
  featureSubtitle,
  imagePath,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Interactive Demo State inside Modal
  const [atsScore, setAtsScore] = useState<number>(88);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [demoCode, setDemoCode] = useState<string>(
    `// Campus to Career AI - Code Quality Analyzer\nfunction findTwoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`
  );
  const [codeScore, setCodeScore] = useState<number>(96);

  const handleRunDemo = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (featureId === "resume") setAtsScore(95);
      if (featureId === "coding" || featureId === "github") setCodeScore(99);
    }, 1000);
  };

  const handleLaunchApp = () => {
    onClose();
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-super-duper glass-glow-cyan rounded-3xl border border-white/20 p-6 md:p-8 text-slate-100 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
                    Interactive Live Preview
                  </span>
                  <span className="text-xs text-slate-400">• V1.0 Launch Stage</span>
                </div>
                <h2 className="text-2xl font-bold text-gradient mt-1">{featureTitle}</h2>
                <p className="text-sm text-slate-300">{featureSubtitle}</p>
              </div>
            </div>

            {/* Content Body based on Feature ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {/* Feature Image Card */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/15 glass-strong shadow-xl">
                <img
                  src={imagePath}
                  alt={featureTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center space-x-2 text-xs font-medium text-cyan-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md">
                    <Activity className="w-4 h-4 animate-pulse text-cyan-400" />
                    <span>Gemini AI Engine Neural Render</span>
                  </div>
                </div>
              </div>

              {/* Interactive Sandbox Simulator */}
              <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 glass-strong">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    <span>Live Feature Sandbox</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Try the interactive capabilities before launching your session.
                  </p>

                  {featureId === "coding" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-300">
                        <span className="font-mono text-cyan-300 flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> TwoSum.ts
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                          Code Score: {codeScore}/100
                        </span>
                      </div>
                      <textarea
                        value={demoCode}
                        onChange={(e) => setDemoCode(e.target.value)}
                        rows={6}
                        className="w-full font-mono text-xs p-3 rounded-xl bg-slate-950/90 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-600/30"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing Code Complexity...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Run AI Code Audit & Platform Sync</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {featureId === "resume" && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-center">
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                          ATS Match Probability
                        </span>
                        <div className="text-4xl font-extrabold text-gradient my-1">
                          {atsScore}%
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-blue-600 h-full transition-all duration-700"
                            style={{ width: `${atsScore}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/30"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Optimizing Resume Bullets...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Simulate Instant ATS Optimization</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {featureId !== "coding" && featureId !== "resume" && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 space-y-2">
                        <div className="flex items-center justify-between font-semibold text-cyan-300">
                          <span>Feature Capability</span>
                          <span>Status</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>AI Neural Processing</span>
                          <span className="text-emerald-400 font-bold">Active V1.0</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Real-time Feedback Engine</span>
                          <span className="text-emerald-400 font-bold">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Student Career Analytics</span>
                          <span className="text-cyan-400 font-bold">Synced</span>
                        </div>
                      </div>
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-purple-600/30"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Loading Neural Models...</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-4 h-4" />
                            <span>Initialize Feature Demonstration</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Included in Launch Edition</span>
                  </span>
                  <span className="text-amber-300 font-medium flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9 / 5 Rating</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="text-xs text-slate-300">
                Ready to experience the complete platform? Launch into your workspace now.
              </div>
              <button
                onClick={handleLaunchApp}
                className="w-full sm:w-auto px-6 py-3 rounded-xl btn-gradient btn-gradient-hover font-bold text-sm flex items-center justify-center space-x-2 shadow-xl"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Launch App & Login"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
