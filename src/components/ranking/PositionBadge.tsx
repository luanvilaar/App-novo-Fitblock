import React from "react";
import { accentWithOpacity } from "@/utils/colorUtils";

interface PositionBadgeProps {
    position: number;
    accentColor?: string;
}

const PositionBadge: React.FC<PositionBadgeProps> = React.memo(({ position, accentColor }) => {
    const isTop1 = position === 1;
    const isTop2 = position === 2;
    const isTop3 = position === 3;

    const accent = accentColor || "hsl(var(--primary))";

    const getStyle = (): React.CSSProperties => {
        if (isTop1) return {
            backgroundColor: accentWithOpacity(accent, 0.2),
            color: accent,
            borderColor: accentWithOpacity(accent, 0.3),
        };
        if (isTop2) return {
            backgroundColor: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--foreground) / 0.9)",
            borderColor: "hsl(var(--border) / 0.5)",
        };
        if (isTop3) return {
            backgroundColor: "hsl(var(--muted) / 0.3)",
            color: "hsl(var(--foreground) / 0.7)",
            borderColor: "hsl(var(--border) / 0.3)",
        };
        return {
            color: "hsl(var(--muted-foreground))",
            borderColor: "transparent",
        };
    };

    return (
        <div
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border font-black italic shrink-0 transition-all duration-300"
            style={getStyle()}
        >
            <span className={isTop1 ? "text-sm sm:text-base" : "text-xs sm:text-sm"}>{position}º</span>
        </div>
    );
});

PositionBadge.displayName = "PositionBadge";

export default PositionBadge;
