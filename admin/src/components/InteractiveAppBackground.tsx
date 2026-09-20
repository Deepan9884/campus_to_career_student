import React from "react";
import { useTheme } from "../lib/theme-context";

export const InteractiveAppBackground: React.FC = () => {
  const { accentColor } = useTheme();

  const orbConfig = {
    indigo: {
      orb1: "from-indigo-600/08 via-slate-800/05 to-transparent",
      orb2: "from-blue-600/06 via-slate-900/05 to-transparent",
      orb3: "from-indigo-500/05 via-slate-800/04 to-transparent",
    },
    purple: {
      orb1: "from-purple-600/08 via-slate-800/05 to-transparent",
      orb2: "from-indigo-600/06 via-slate-900/05 to-transparent",
      orb3: "from-purple-500/05 via-slate-800/04 to-transparent",
    },
    emerald: {
      orb1: "from-emerald-600/08 via-slate-800/05 to-transparent",
      orb2: "from-teal-600/06 via-slate-900/05 to-transparent",
      orb3: "from-emerald-500/05 via-slate-800/04 to-transparent",
    },
    amber: {
      orb1: "from-amber-600/08 via-slate-800/05 to-transparent",
      orb2: "from-orange-600/06 via-slate-900/05 to-transparent",
      orb3: "from-amber-500/05 via-slate-800/04 to-transparent",
    },
    cyan: {
      orb1: "from-sky-600/08 via-slate-800/05 to-transparent",
      orb2: "from-blue-600/06 via-slate-900/05 to-transparent",
      orb3: "from-sky-500/05 via-slate-800/04 to-transparent",
    },
  }[accentColor] || {
    orb1: "from-indigo-600/08 via-slate-800/05 to-transparent",
    orb2: "from-blue-600/06 via-slate-900/05 to-transparent",
    orb3: "from-indigo-500/05 via-slate-800/04 to-transparent",
  };

  return (
    <div id="interactive-canvas-bg" className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print" aria-hidden="true">
      {/* Dark mode only: Primary top-left orb */}
      <div
        className={`absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br ${orbConfig.orb1} blur-[180px] animate-pulse pointer-events-none dark:block hidden`}
        style={{ animationDuration: "12s" }}
      />
      {/* Dark mode only: Secondary right orb */}
      <div
        className={`absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl ${orbConfig.orb2} blur-[160px] animate-pulse pointer-events-none dark:block hidden`}
        style={{ animationDuration: "16s", animationDelay: "4s" }}
      />
      {/* Dark mode only: Bottom center orb */}
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse pointer-events-none dark:block hidden"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)", animationDuration: "20s", animationDelay: "8s" }}
      />
      {/* Dark mode only: Mid-screen diagonal accent orb */}
      <div
        className={`absolute top-1/2 left-1/4 w-[450px] h-[350px] rounded-full bg-gradient-to-tr ${orbConfig.orb3} blur-[140px] animate-pulse pointer-events-none dark:block hidden`}
        style={{ animationDuration: "18s", animationDelay: "2s" }}
      />
      {/* Dark mode vignette overlay */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(11,15,23,0.50) 70%, rgba(11,15,23,0.92) 100%)" }}
      />
      {/* Dark mode subtle dot-mesh texture */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Light mode ultra-subtle top ambient glow */}
      <div
        className="absolute inset-0 block dark:hidden pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(79,70,229,0.03) 0%, transparent 70%)" }}
      />
    </div>
  );
};
