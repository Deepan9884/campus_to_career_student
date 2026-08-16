import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  ArrowRight,
  Terminal,
  Activity,
  Code,
  CheckCircle2,
  Star,
  Play,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useAuth } from "@/stores";

interface FeaturePreviewModalProps {
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
  const [demoCode, setDemoCode] = useState(
    `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`
  );
  const [codeScore, setCodeScore] = useState(88);
  const [atsScore, setAtsScore] = useState(76);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLaunchApp = () => {
    onClose();
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  const handleRunDemo = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setCodeScore((prev) => Math.min(98, prev + 6));
      setAtsScore((prev) => Math.min(94, prev + 8));
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#080D18]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl border border-[#2F4B6B]/80 p-6 md:p-8 text-[#F2F4F7] shadow-2xl bg-[#131B2E]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#93A0B5] hover:text-[#F2F4F7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                <Layers className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold uppercase tracking-wider">
                    Interactive Live Preview
                  </span>
                  <span className="text-xs text-[#93A0B5]">• V1.0 Launch Stage</span>
                </div>
                <h2 className="text-2xl font-bold text-gradient mt-1">{featureTitle}</h2>
                <p className="text-sm text-[#93A0B5]">{featureSubtitle}</p>
              </div>
            </div>

            {/* Content Body based on Feature ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {/* Feature Image Card */}
              <div className="relative group overflow-hidden rounded-2xl border border-[#2F4B6B]/60 glass-strong shadow-xl">
                <img
                  src={imagePath}
                  alt={featureTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1A]/90 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center space-x-2 text-xs font-medium text-indigo-400 bg-[#0A0F1A]/90 px-3 py-1.5 rounded-lg border border-indigo-500/30 backdrop-blur-md">
                    <Activity className="w-4 h-4 animate-pulse text-indigo-400" />
                    <span>Gemini AI Engine Neural Render</span>
                  </div>
                </div>
              </div>

              {/* Interactive Sandbox Simulator */}
              <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#1B2740]/40 border border-[#2F4B6B]/60 glass-strong">
                <div>
                  <h3 className="text-lg font-bold text-[#F2F4F7] flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    <span>Live Feature Sandbox</span>
                  </h3>
                  <p className="text-xs text-[#93A0B5] mt-1">
                    Try the interactive capabilities before launching your session.
                  </p>

                  {featureId === "coding" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs text-[#93A0B5]">
                        <span className="font-mono text-indigo-400 flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> TwoSum.ts
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#4CAF7D]/20 text-[#4CAF7D] text-[11px] font-bold font-mono">
                          Code Score: {codeScore}/100
                        </span>
                      </div>
                      <textarea
                        value={demoCode}
                        onChange={(e) => setDemoCode(e.target.value)}
                        rows={6}
                        className="w-full font-mono text-xs p-3 rounded-xl bg-[#0A0F1A] border border-[#2F4B6B] text-[#F2F4F7] focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
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
                      <div className="p-4 rounded-xl bg-[#0A0F1A]/80 border border-[#2F4B6B] text-center">
                        <span className="text-xs text-[#93A0B5] uppercase tracking-widest font-semibold">
                          ATS Match Probability
                        </span>
                        <div className="text-4xl font-extrabold text-gradient my-1 font-mono">
                          {atsScore}%
                        </div>
                        <div className="w-full bg-[#1B2740] h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-gradient-to-r from-[#2F4B6B] to-indigo-500 h-full transition-all duration-700"
                            style={{ width: `${atsScore}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Optimizing Resume Bullets...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Simulate Instant ATS Optimization</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {featureId !== "coding" && featureId !== "resume" && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-[#0A0F1A]/80 border border-[#2F4B6B] text-xs text-[#93A0B5] space-y-2">
                        <div className="flex items-center justify-between font-semibold text-indigo-400">
                          <span>Feature Capability</span>
                          <span>Status</span>
                        </div>
                        <div className="flex items-center justify-between text-[#F2F4F7]">
                          <span>AI Neural Processing</span>
                          <span className="text-[#4CAF7D] font-bold font-mono">Active V1.0</span>
                        </div>
                        <div className="flex items-center justify-between text-[#F2F4F7]">
                          <span>Real-time Feedback Engine</span>
                          <span className="text-[#4CAF7D] font-bold font-mono">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between text-[#F2F4F7]">
                          <span>Student Career Analytics</span>
                          <span className="text-indigo-400 font-bold font-mono">Synced</span>
                        </div>
                      </div>
                      <button
                        onClick={handleRunDemo}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
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

                <div className="pt-4 border-t border-[#2F4B6B]/60 mt-4 flex items-center justify-between text-xs text-[#93A0B5]">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7D]" />
                    <span>Included in Launch Edition</span>
                  </span>
                  <span className="text-indigo-400 font-medium font-mono flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9 / 5 Rating</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2F4B6B]/60">
              <div className="text-xs text-[#93A0B5]">
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
