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
    subtle: 0.55,
    balanced: 1.0,
    vivid: 1.45,
    radiant: 1.9,
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
    low: 80,
    medium: 155,
    high: 250,
  }[starDensity];

  // ---------------------------------------------------------------------------
  // Canvas Stars & Interactive Constellation Animation Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!starsEnabled) return;

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
    const starPalette = [
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
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.6 + 0.35,
        pulseSpeed: Math.random() * 0.03 + 0.012,
        pulsePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
      };
    });

    // Spawn a shooting star
    const spawnShootingStar = () => {
      if (!shootingStarsEnabled) return;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // ~45 deg downward
      const speed = Math.random() * 10 + 12;
      shootingStarsRef.current.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * (height * 0.4),
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 70 + 50,
        speed,
        opacity: 1,
        color: orbColors.starTint || "#FFFFFF",
        size: Math.random() * 1.5 + 1.2,
      });
    };

    // Pointer move listener
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      mouseRef.current = { x: clientX, y: clientY, active: true };
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
        maxRadius: Math.min(width, height) * 0.28,
        opacity: 0.65,
      });
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("click", handleClick, { passive: true });

    // Animation Loop
    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Periodically trigger a shooting star (every 4-7 seconds)
      const now = Date.now();
      if (shootingStarsEnabled && now - lastShootingStarTime.current > Math.random() * 3000 + 4000) {
        spawnShootingStar();
        lastShootingStarTime.current = now;
      }

      // 1. Draw Active Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const ripple = ripplesRef.current[i];
        ripple.radius += 4.5;
        ripple.opacity -= 0.014;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = orbColors.constellationLine || "rgba(167, 139, 250, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = ripple.opacity;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Shooting Stars
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const s = shootingStarsRef.current[i];
        s.x += s.dx;
        s.y += s.dy;
        s.opacity -= 0.018;

        if (s.opacity <= 0 || s.x > width + 100 || s.y > height + 100) {
          shootingStarsRef.current.splice(i, 1);
          continue;
        }

        const tailX = s.x - (s.dx / s.speed) * s.length;
        const tailY = s.y - (s.dy / s.speed) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, s.color);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.size;
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Glowing head
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const mouse = mouseRef.current;
      const connectionDist = 135;

      // 3. Update & Draw Stars + Constellation Lines
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Gentle natural drift
        star.originX += star.vx;
        star.originY += star.vy;

        // Wrap around edges
        if (star.originX < 0) star.originX = width;
        if (star.originX > width) star.originX = 0;
        if (star.originY < 0) star.originY = height;
        if (star.originY > height) star.originY = 0;

        // Cursor magnetic interaction
        if (interactiveConstellations && mouse.active) {
          const dx = mouse.x - star.originX;
          const dy = mouse.y - star.originY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            // Gentle gravitational pull
            const force = (1 - dist / connectionDist) * 14;
            star.x = star.originX + (dx / dist) * force;
            star.y = star.originY + (dy / dist) * force;

            // Draw line from mouse to star
            const alpha = (1 - dist / connectionDist) * 0.45;
            ctx.save();
            ctx.strokeStyle = orbColors.constellationLine;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();
            ctx.restore();
          } else {
            // Smoothly return to origin
            star.x += (star.originX - star.x) * 0.08;
            star.y += (star.originY - star.y) * 0.08;
          }
        } else {
          star.x = star.originX;
          star.y = star.originY;
        }

        // Connect nearby stars together
        if (interactiveConstellations) {
          for (let j = i + 1; j < stars.length; j++) {
            const starB = stars[j];
            const distBetween = Math.hypot(star.x - starB.x, star.y - starB.y);

            if (distBetween < 80) {
              const alpha = (1 - distBetween / 80) * 0.22;
              ctx.save();
              ctx.strokeStyle = orbColors.constellationLine;
              ctx.lineWidth = 0.5;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(star.x, star.y);
              ctx.lineTo(starB.x, starB.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Calculate pulsing star twinkle brightness
        const pulse = Math.sin(time * star.pulseSpeed * 60 + star.pulsePhase);
        const currentAlpha = Math.max(0.15, Math.min(1, star.baseAlpha + pulse * 0.25));

        // Draw Star Glow & Core
        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;

        // Subtle outer star halo
        if (star.size > 1.4) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
          ctx.globalAlpha = currentAlpha * 0.25;
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
        const radGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        radGrad.addColorStop(0, orbColors.cursorGlow || "rgba(167, 139, 250, 0.2)");
        radGrad.addColorStop(1, "transparent");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
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
    starsEnabled,
    starDensity,
    starCount,
    interactiveConstellations,
    shootingStarsEnabled,
    clickRipple,
    orbColors,
  ]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Interactive Star Field Canvas */}
      {starsEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      {/* 2. Soft Volumetric Atmospheric Glowing Orbs */}
      <div
        className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[160px] animate-aurora-pulse pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${orbColors.orb1} 0%, transparent 70%)`,
          opacity: intensityMultiplier,
          animationDuration,
        }}
      />
      <div
        className="absolute top-1/3 -right-36 w-[600px] h-[600px] rounded-full blur-[170px] animate-aurora-pulse pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${orbColors.orb2} 0%, transparent 70%)`,
          opacity: intensityMultiplier * 0.9,
          animationDuration: motionSpeed === "static" ? "0s" : "18s",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[150px] animate-aurora-pulse pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${orbColors.orb3} 0%, transparent 70%)`,
          opacity: intensityMultiplier * 0.85,
          animationDuration: motionSpeed === "static" ? "0s" : "22s",
          animationDelay: "6s",
        }}
      />

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
