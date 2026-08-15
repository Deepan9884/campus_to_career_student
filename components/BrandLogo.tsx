import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  collapsed = false,
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Crisp Vector Logo Mark */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 rounded-xl bg-gradient-to-br from-[#1B2740] via-[#111827] to-[#0A0F1A] p-1.5 border border-[#2F4B6B]/60 shadow-lg shadow-black/40 flex items-center justify-center group`}
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(224, 138, 60, 0.25)",
        }}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Graduation Cap */}
          <path
            d="M5 14L18 7L31 14L18 21L5 14Z"
            fill="url(#cap-grad)"
            stroke="#F2F4F7"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M10 17V22.5C10 24.5 13.5 26.5 18 26.5C22.5 26.5 26 24.5 26 22.5V17"
            stroke="#93A0B5"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M31 14V21.5"
            stroke="#E08A3C"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Ascending Career Arrow */}
          <path
            d="M11 25L17 19L22 23L29 11"
            stroke="url(#arrow-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 11H29V16"
            stroke="#E08A3C"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient id="cap-grad" x1="5" y1="7" x2="31" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2F4B6B" />
              <stop offset="1" stopColor="#1B2740" />
            </linearGradient>
            <linearGradient id="arrow-grad" x1="11" y1="25" x2="29" y2="11" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F2F4F7" />
              <stop offset="0.5" stopColor="#E08A3C" />
              <stop offset="1" stopColor="#F3A75B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <div className={`font-extrabold tracking-tight text-white flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className="font-['Space_Grotesk',sans-serif]">CampusToCareer</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E08A3C]/20 border border-[#E08A3C]/40 text-[#E08A3C] tracking-wide uppercase">
              AI
            </span>
          </div>
          <span className="text-[9px] font-medium text-[#93A0B5] tracking-wider uppercase mt-0.5">
            Career Prep Studio
          </span>
        </div>
      )}
    </div>
  );
};
export default BrandLogo;
