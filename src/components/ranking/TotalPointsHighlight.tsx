import React from "react";

interface TotalPointsHighlightProps {
    points: number;
    label?: string;
    isTop1?: boolean;
    branding?: { accentColor: string } | null;
}

const TotalPointsHighlight: React.FC<TotalPointsHighlightProps> = ({ points, label = "PTS", isTop1, branding }) => {
    return (
        <div className="flex flex-col items-end leading-none">
            <span
                className={`text-lg sm:text-2xl font-light tabular-nums tracking-tight transition-colors duration-300 ${isTop1 && !branding ? "text-primary" : !isTop1 ? "text-foreground" : ""}`}
                style={isTop1 && branding ? { color: branding.accentColor } : undefined}
            >
                {points}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground tracking-widest mt-0.5 uppercase">
                {label}
            </span>
        </div>
    );
};

export default TotalPointsHighlight;
