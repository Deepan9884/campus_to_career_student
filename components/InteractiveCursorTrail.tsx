import React, { useEffect, useRef, useState } from "react";
import { useAmbientLighting, AMBIENT_PRESETS } from "@/stores/ambientLightingStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

interface CursorRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export const InteractiveCursorTrail: React.FC = () => {
  const {
    presetId,
    uiMode,
    starsEnabled,
    interactiveConstellations,
    clickRipple,
  } = useAmbientLighting();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number; active: boolean; isHovering: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
    isHovering: false,
  });
  const smoothedMouse = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<CursorRipple[]>([]);
  const lastEmitPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  // Light Mode detection
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
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

  // Active color preset
  const activePreset = AMBIENT_PRESETS.find((p) => p.id === presetId) || AMBIENT_PRESETS[0];

  const lightSparkColors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#3B82F6", // Blue
    "#06B6D4", // Cyan
    "#10B981", // Emerald
    "#EC4899", // Pink
    "#F59E0B", // Amber
  ];

  const darkSparkColors = [
    "#A78BFA",
    "#38BDF8",
    "#34D399",
    "#F472B6",
    "#FBBF24",
    "#818CF8",
    "#FFFFFF",
  ];

  useEffect(() => {
    // Removed early return for minimal UI so cursor trail always works

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

    const handlePointerMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      mousePos.current.active = true;

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("role") === "button" ||
          target.classList.contains("cursor-pointer") ||
          target.closest("button") !== null ||
          target.closest("a") !== null;
        mousePos.current.isHovering = Boolean(isClickable);
      }

      // Emit trail particle when cursor moves sufficient distance
      const dx = e.clientX - lastEmitPos.current.x;
      const dy = e.clientY - lastEmitPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 12) {
        lastEmitPos.current = { x: e.clientX, y: e.clientY };
        const palette = isLightMode ? lightSparkColors : darkSparkColors;
        const color = palette[Math.floor(Math.random() * palette.length)];

        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
          size: isLightMode ? Math.random() * 2.4 + 1.2 : Math.random() * 2.2 + 1.0,
          color,
          alpha: isLightMode ? 0.85 : 0.9,
          maxLife: 35,
          life: 35,
        });

        if (particlesRef.current.length > 40) {
          particlesRef.current.shift();
        }
      }
    };

    const handlePointerLeave = () => {
      mousePos.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickRipple) return;
      const rippleColor = isLightMode
        ? "rgba(99, 102, 241, 0.65)"
        : (activePreset.colors.cursorGlow || "rgba(167, 139, 250, 0.6)");

      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: isLightMode ? 140 : 160,
        opacity: 0.8,
        color: rippleColor,
      });

      // Spawn burst of stardust sparks on click
      const palette = isLightMode ? lightSparkColors : darkSparkColors;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 2.5 + 1.5;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1.5,
          color: palette[i % palette.length],
          alpha: 1,
          maxLife: 45,
          life: 45,
        });
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("click", handleClick);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const { x: targetX, y: targetY, active, isHovering } = mousePos.current;

      // Smooth lag interpolation for the luminous ambient cursor glow
      if (active) {
        if (smoothedMouse.current.x === -1000) {
          smoothedMouse.current.x = targetX;
          smoothedMouse.current.y = targetY;
        } else {
          smoothedMouse.current.x += (targetX - smoothedMouse.current.x) * 0.22;
          smoothedMouse.current.y += (targetY - smoothedMouse.current.y) * 0.22;
        }
      }

      const currentX = smoothedMouse.current.x;
      const currentY = smoothedMouse.current.y;

      // 1. Draw Expanding Click Ripples
      if (ripplesRef.current.length > 0) {
        ripplesRef.current = ripplesRef.current.filter((r) => r.opacity > 0.01);
        for (const ripple of ripplesRef.current) {
          ripple.radius += (ripple.maxRadius - ripple.radius) * 0.1;
          ripple.opacity *= 0.93;

          ctx.save();
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = ripple.color;
          ctx.lineWidth = isLightMode ? 2.5 : 1.8;
          ctx.globalAlpha = ripple.opacity;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2. Draw Soft Luminous Ambient Cursor Aura
      if (active && currentX > -100) {
        ctx.save();
        const auraRadius = isHovering ? 80 : 60;
        const grad = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, auraRadius);

        if (isLightMode) {
          // Stronger luminous radiant violet/indigo aura in Light Mode so it doesn't disappear
          grad.addColorStop(0, isHovering ? "rgba(99, 102, 241, 0.55)" : "rgba(99, 102, 241, 0.35)");
          grad.addColorStop(0.45, isHovering ? "rgba(168, 85, 247, 0.30)" : "rgba(168, 85, 247, 0.18)");
          grad.addColorStop(1, "transparent");
        } else {
          // Stronger celestial glow aura in Dark Mode
          grad.addColorStop(0, isHovering ? "rgba(167, 139, 250, 0.45)" : "rgba(167, 139, 250, 0.30)");
          grad.addColorStop(0.5, isHovering ? "rgba(56, 189, 248, 0.25)" : "rgba(56, 189, 248, 0.15)");
          grad.addColorStop(1, "transparent");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Update & Draw Stardust Particle Trail
      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02; // soft gravity
          p.life -= 1;
          const progress = p.life / p.maxLife;
          const currentAlpha = p.alpha * progress;

          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = p.color;

          // Glowing outer stardust halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
          ctx.globalAlpha = currentAlpha * 0.35;
          ctx.fill();

          // Sharp center sparkle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.globalAlpha = currentAlpha;
          ctx.fill();

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("click", handleClick);
    };
  }, [uiMode, isLightMode, clickRipple, activePreset]);

  // Removed early return for minimal mode so cursor trail always works

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      aria-hidden="true"
    />
  );
};
