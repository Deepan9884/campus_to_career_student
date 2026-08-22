import React, { useEffect, useState } from "react";
import { useAuth } from "@/stores";

export const InteractiveAppBackground: React.FC = () => {
  const { user } = useAuth();
  const [currentAccent, setCurrentAccent] = useState<string>("indigo");

  // Track active data-accent attribute or user preferences
  useEffect(() => {
    const updateAccent = () => {
      const docAccent = document.documentElement.getAttribute("data-accent");
      const savedAccent =
        docAccent ||
        user?.preferences?.accentColor ||
        (typeof localStorage !== "undefined" ? localStorage.getItem("c2c_accent") : null) ||
        "indigo";
      setCurrentAccent(savedAccent);
    };

    updateAccent();

    // Observe changes to data-accent on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-accent") {
          updateAccent();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent"] });
    return () => observer.disconnect();
  }, [user?.preferences?.accentColor]);

  const orbConfig = {
    indigo: {
      orb1: "from-violet-600/18 via-purple-600/12 to-transparent",
      orb2: "from-pink-500/14 via-rose-500/10 to-transparent",
    },
    purple: {
      orb1: "from-purple-600/20 via-fuchsia-600/15 to-transparent",
      orb2: "from-pink-500/16 via-rose-500/12 to-transparent",
    },
    emerald: {
      orb1: "from-emerald-500/18 via-teal-500/14 to-transparent",
      orb2: "from-teal-500/14 via-cyan-500/10 to-transparent",
    },
    amber: {
      orb1: "from-amber-400/18 via-orange-400/14 to-transparent",
      orb2: "from-yellow-400/14 via-amber-300/10 to-transparent",
    },
    cyan: {
      orb1: "from-sky-500/18 via-cyan-500/14 to-transparent",
      orb2: "from-blue-500/14 via-sky-400/10 to-transparent",
    },
    rose: {
      orb1: "from-rose-500/18 via-pink-500/14 to-transparent",
      orb2: "from-pink-400/14 via-fuchsia-400/10 to-transparent",
    },
  }[currentAccent] || {
    orb1: "from-violet-600/18 via-purple-600/12 to-transparent",
    orb2: "from-pink-500/14 via-rose-500/10 to-transparent",
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Soft Aurora Ambient Glowing Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${orbConfig.orb1} blur-[160px] animate-aurora-pulse pointer-events-none`}
        style={{ animationDuration: "12s" }}
      />
      <div
        className={`absolute top-1/3 -right-36 w-[550px] h-[550px] rounded-full bg-gradient-to-bl ${orbConfig.orb2} blur-[160px] animate-aurora-pulse pointer-events-none`}
        style={{ animationDuration: "16s", animationDelay: "4s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[140px] animate-aurora-pulse pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(196,181,253,0.12), transparent 70%)",
          animationDuration: "20s",
          animationDelay: "8s",
        }}
      />

      {/* Soft Vignette — elegant edge darkening */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(14,11,30,0.55) 80%, rgba(14,11,30,0.88) 100%)",
        }}
      />
      {/* Light mode vignette */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(250,248,255,0.20) 85%)",
        }}
      />
    </div>
  );
};
