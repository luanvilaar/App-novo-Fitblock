import React from "react";

interface MedalIconProps {
  position: 1 | 2 | 3;
  size?: number;
}

const medalColors = {
  1: { main: "#FFD700", dark: "#B8960F", shine: "#FFF4B8" },
  2: { main: "#C0C0C0", dark: "#808080", shine: "#E8E8E8" },
  3: { main: "#CD7F32", dark: "#8B5A2B", shine: "#E8A862" },
};

const MedalIcon: React.FC<MedalIconProps> = ({ position, size = 28 }) => {
  const c = medalColors[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ribbon */}
      <polygon
        points="14,0 20,14 26,0"
        fill="url(#ribbonGrad)"
      />
      <polygon
        points="12,0 18,12 16,0"
        fill="url(#ribbonGrad)"
        opacity="0.5"
      />
      <polygon
        points="28,0 22,12 24,0"
        fill="url(#ribbonGrad)"
        opacity="0.5"
      />

      {/* Medal body - diamond shape */}
      <g transform="translate(20, 24) rotate(45)">
        <rect
          x="-10"
          y="-10"
          width="20"
          height="20"
          rx="2.5"
          fill={`url(#medalGrad${position})`}
          stroke={c.dark}
          strokeWidth="1"
        />
        {/* Inner border */}
        <rect
          x="-7.5"
          y="-7.5"
          width="15"
          height="15"
          rx="1.5"
          fill="none"
          stroke={c.shine}
          strokeWidth="0.5"
          opacity="0.4"
        />
      </g>

      {/* Number */}
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fill={c.dark}
        fontFamily="Inter, sans-serif"
      >
        {position}
      </text>

      <defs>
        <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(265, 45%, 45%)" />
          <stop offset="100%" stopColor="hsl(280, 40%, 35%)" />
        </linearGradient>
        <linearGradient id={`medalGrad${position}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.shine} />
          <stop offset="50%" stopColor={c.main} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default MedalIcon;
