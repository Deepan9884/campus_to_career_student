import React, { useEffect, useRef } from "react";
import { useAmbientLighting, AMBIENT_PRESETS } from "@/stores/ambientLightingStore";

interface Star {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  vx: number;
  vy: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  opacity: number;
  color: string;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export const InteractiveAppBackground: React.FC = () => {
  const {
    presetId,
    uiMode,
    backgroundType,
    solidBackgroundColor,
    orbsEnabled,
    backgroundOpacity,
    intensity,
    motionSpeed,
    starsEnabled,
    starDensity,
    interactiveConstellations,
    shootingStars: shootingStarsEnabled,
    clickRipple,
    customColors,
  } = useAmbientLighting();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const ripplesRef = useRef<Ripple[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const lastShootingStarTime = useRef<number>(Date.now());

  // Check if Light Mode is active on the root HTML
  const [isLightMode, setIsLightMode] = React.useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light");
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Determine active color configuration
  const activePreset = AMBIENT_PRESETS.find((p) => p.id === presetId) || AMBIENT_PRESETS[0];

  const orbColors =
    presetId === "custom"
      ? {
          orb1: customColors.orb1,
          orb2: customColors.orb2,
          orb3: customColors.orb3,
          starTint: customColors.starTint,
          constellationLine: "rgba(167, 139, 250, 0.35)",
          cursorGlow: "rgba(167, 139, 250, 0.25)",
        }
      : activePreset.colors;

  // Multiplier for glow opacity based on intensity setting
  const intensityMultiplier = {
    subtle: 0.45,
    balanced: 0.9,
    vivid: 1.35,
    radiant: 1.75,
  }[intensity];

  // Motion speed duration in seconds
  const animationDuration = {
    static: "0s",
    calm: "24s",
    flow: "14s",
    dynamic: "7s",
  }[motionSpeed];

  // Star density count
  const starCount = {
    low: 50,
    medium: 110,
    high: 190,
  }[starDensity];

  const shouldRenderStars = starsEnabled && (backgroundType === "stars" || backgroundType === "full");
  const shouldRenderOrbs = orbsEnabled && (backgroundType === "orbs" || backgroundType === "full");

  // ---------------------------------------------------------------------------
  // Canvas Stars & Interactive Constellation Animation Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!shouldRenderStars) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Initialize Stars
    const starPalette = isLightMode
      ? [
          "#6366F1", // Indigo
          "#8B5CF6", // Purple
          "#3B82F6", // Blue
          "#06B6D4", // Cyan
          "#10B981", // Emerald
          "#EC4899", // Pink
          "#F59E0B", // Amber
        ]
      : [
          "#FFFFFF",
          "#F8FAFC",
          orbColors.starTint,
          "#E2E8F0",
          "#FEF3C7",
          "#DDD6FE",
        ];

    const stars: Star[] = Array.from({ length: starCount }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        originX: x,
        originY: y,
        size: isLightMode ? Math.random() * 2.2 + 0.8 : Math.random() * 1.6 + 0.5,
        baseAlpha: isLightMode ? Math.random() * 0.45 + 0.4 : Math.random() * 0.5 + 0.25,
        pulseSpeed: Math.random() * 0.025 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
      };
    });

    // Spawn a shooting star
    const spawnShootingStar = () => {
      if (!shootingStarsEnabled) return;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 6 + 7;
      shootingStarsRef.current.push({
        x: Math.random() * (width * 0.8),
        y: Math.random() * (height * 0.4),
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 90 + 60,
        speed,
        opacity: 0.9,
        color: orbColors.starTint,
        size: Math.random() * 1.5 + 1,
      });
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;
      if (clientX !== undefined && clientY !== undefined) {
        mouseRef.current = { x: clientX, y: clientY, active: true };
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickRipple) return;
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 180,
        opacity: 0.6,
      });
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("click", handleClick);

    // Render loop
    let lastTime = performance.now();
    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Update & Draw Click Ripples
      if (clickRipple && ripplesRef.current.length > 0) {
        ripplesRef.current = ripplesRef.current.filter((r) => r.opacity > 0.01);
        for (const ripple of ripplesRef.current) {
          ripple.radius += (ripple.maxRadius - ripple.radius) * 0.08;
          ripple.opacity *= 0.94;

          ctx.save();
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = orbColors.cursorGlow || "rgba(167, 139, 250, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = ripple.opacity;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Update & Spawn Shooting Stars
      if (shootingStarsEnabled) {
        const now = Date.now();
        if (now - lastShootingStarTime.current > 7000 + Math.random() * 5000) {
          spawnShootingStar();
          lastShootingStarTime.current = now;
        }

        shootingStarsRef.current = shootingStarsRef.current.filter((s) => s.opacity > 0.02);

        for (const star of shootingStarsRef.current) {
          star.x += star.dx;
          star.y += star.dy;
          star.opacity *= 0.96;

          const tailX = star.x - (star.dx / star.speed) * star.length;
          const tailY = star.y - (star.dy / star.speed) * star.length;

          const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(0.7, star.color);
          gradient.addColorStop(1, "#FFFFFF");

          ctx.save();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = star.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = star.opacity;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Interactive Constellation Lines between nearby stars & mouse
      if (interactiveConstellations && mouse.active) {
        ctx.save();
        ctx.strokeStyle = isLightMode
          ? "rgba(99, 102, 241, 0.55)"
          : (orbColors.constellationLine || "rgba(167, 139, 250, 0.3)");
        ctx.lineWidth = isLightMode ? 1.2 : 0.75;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const distToMouse = Math.hypot(s.x - mouse.x, s.y - mouse.y);
          if (distToMouse < 130) {
            const alpha = (1 - distToMouse / 130) * (isLightMode ? 0.65 : 0.45);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Connect nearby stars with each other near the cursor
            for (let j = i + 1; j < stars.length; j++) {
              const s2 = stars[j];
              const distBetween = Math.hypot(s.x - s2.x, s.y - s2.y);
              if (distBetween < 80) {
                ctx.globalAlpha = (1 - distBetween / 80) * (isLightMode ? 0.40 : 0.25);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
              }
            }
          }
        }
        ctx.restore();
      }

      // Render & Twinkle Individual Stars
      for (const star of stars) {
        star.pulsePhase += star.pulseSpeed;
        const twinkle = Math.sin(star.pulsePhase) * 0.35 + 0.65;
        const currentAlpha = star.baseAlpha * twinkle;

        // Subtle gentle drift
        star.x += star.vx;
        star.y += star.vy;

        // Mouse repelling physics
        if (mouse.active) {
          const dx = star.x - mouse.x;
          const dy = star.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90 && dist > 0) {
            const force = (1 - dist / 90) * 1.5;
            star.x += (dx / dist) * force;
            star.y += (dy / dist) * force;
          }
        }

        // Return gracefully to origin
        star.x += (star.originX - star.x) * 0.01;
        star.y += (star.originY - star.y) * 0.01;

        // Wrap edges
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.save();
        ctx.fillStyle = star.color;

        // Star glow aura
        if (star.size > 1.2) {
          ctx.globalAlpha = currentAlpha * 0.25;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core star
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw subtle ambient glow ring at mouse position
      if (interactiveConstellations && mouse.active) {
        ctx.save();
        const radGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 75);
        if (isLightMode) {
          radGrad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
          radGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.15)");
          radGrad.addColorStop(1, "transparent");
        } else {
          radGrad.addColorStop(0, orbColors.cursorGlow || "rgba(167, 139, 250, 0.25)");
          radGrad.addColorStop(1, "transparent");
        }
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("click", handleClick);
    };
  }, [
    shouldRenderStars,
    starDensity,
    starCount,
    interactiveConstellations,
    shootingStarsEnabled,
    clickRipple,
    orbColors,
    isLightMode,
  ]);

  // Helper to determine if a hex color is dark
  const isColorDark = (hex: string) => {
    if (!hex || !hex.startsWith("#")) return false;
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
    return false;
  };

  // If backgroundType is none, return null for absolute minimalism
  if (backgroundType === "none" || uiMode === "minimal") {
    return null;
  }

  // If solid background is selected
  if (backgroundType === "solid") {
    const resolvedColor = isLightMode
      ? isColorDark(solidBackgroundColor)
        ? "#FAF8FF"
        : solidBackgroundColor
      : !isColorDark(solidBackgroundColor)
        ? "#0B0F19"
        : solidBackgroundColor;

    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-colors duration-500"
        style={{ backgroundColor: resolvedColor }}
        aria-hidden="true"
      />
    );
  }

  const overallOpacity = (backgroundOpacity ?? 100) / 100;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-300"
      style={{ opacity: overallOpacity }}
      aria-hidden="true"
    >
      {/* 1. Interactive Star Field Canvas */}
      {shouldRenderStars && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      {/* 2. Soft Volumetric Atmospheric Glowing Orbs */}
      {shouldRenderOrbs && (
        <>
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] animate-aurora-pulse pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${orbColors.orb1} 0%, transparent 70%)`,
              opacity: intensityMultiplier,
              animationDuration,
            }}
          />
          <div
            className="absolute top-1/3 -right-36 w-[550px] h-[550px] rounded-full blur-[170px] animate-aurora-pulse pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${orbColors.orb2} 0%, transparent 70%)`,
              opacity: intensityMultiplier * 0.9,
              animationDuration: motionSpeed === "static" ? "0s" : "18s",
              animationDelay: "3s",
            }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full blur-[150px] animate-aurora-pulse pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${orbColors.orb3} 0%, transparent 70%)`,
              opacity: intensityMultiplier * 0.85,
              animationDuration: motionSpeed === "static" ? "0s" : "22s",
              animationDelay: "6s",
            }}
          />
        </>
      )}

      {/* 3. Soft Vignette — Dark Mode Deep Space Framing */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(12,9,26,0.45) 75%, rgba(10,8,22,0.85) 100%)",
        }}
      />

      {/* 4. Soft Vignette — Light Mode Soft Pearl Glow */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(250,248,255,0.25) 85%)",
        }}
      />
    </div>
  );
};
