import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeaturePanelData } from "./FeatureDeck";
import { Sparkles, ArrowRight, Eye, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores";

export interface VisualStageProps {
  panel: FeaturePanelData;
  onOpenPreviewModal: (panel: FeaturePanelData) => void;
}

export const VisualStage: React.FC<VisualStageProps> = ({ panel, onOpenPreviewModal }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-5 md:p-7 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden group">
      {/* Top Header of Stage */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {panel.badge}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">{panel.title}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">{panel.subtitle}</p>
        </div>

        <button
          onClick={() => onOpenPreviewModal(panel)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-white/10 transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>Interactive Preview</span>
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative z-10 flex-1 my-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-inner flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={panel.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full max-h-[58vh] flex items-center justify-center overflow-hidden"
          >
            <img
              src={panel.imagePath}
              alt={panel.title}
              className={`w-full h-full object-cover rounded-xl transition-transform duration-500 ${
                isZoomed ? "scale-105 cursor-zoom-out" : "scale-100 cursor-zoom-in"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />

            {/* Bottom Overlay with Highlights */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-5 pointer-events-none">
              <div className="flex flex-wrap gap-2 pointer-events-auto">
                {panel.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-slate-900/90 border border-white/15 text-xs text-slate-200 backdrop-blur-md shadow-sm"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative z-10 pt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Free practice • No setup required</span>
        </div>

        <button
          onClick={handlePrimaryAction}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <span>{isAuthenticated ? "Go to Dashboard" : "Sign In to Access Feature"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
