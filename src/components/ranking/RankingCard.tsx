import React from "react";
import { motion } from "framer-motion";
import PositionBadge from "./PositionBadge";
import PositionDelta, { type DeltaStatus } from "./PositionDelta";
import WeeklyBreakdown from "./WeeklyBreakdown";
import TotalPointsHighlight from "./TotalPointsHighlight";
import { Trophy } from "lucide-react";
import type { BoxBranding } from "@/hooks/useBoxBranding";
import { accentWithOpacity } from "@/utils/colorUtils";

interface WorkoutDetail {
    workout_id: string;
    score_raw: string;
    position: number;
    points: number;
}

interface RankedAthlete {
    student_id: string;
    name: string;
    avatar_url?: string | null;
    group_name: string;
    workout_details: WorkoutDetail[];
    total_points: number;
}

interface RankingCardProps {
    athlete: RankedAthlete;
    index: number;
    branding?: BoxBranding | null;
    deltaStatus?: DeltaStatus;
    delta?: number;
    isBiggestClimber?: boolean;
}

const RankingCard: React.FC<RankingCardProps> = React.memo(({ athlete, index, branding, deltaStatus, delta, isBiggestClimber }) => {
    const position = index + 1;
    const isTop1 = position === 1;
    const accent = branding?.accentColor || "hsl(var(--primary))";
    const showGlow = deltaStatus === "up";

    const cardStyle: React.CSSProperties = isTop1
        ? {
            borderColor: accentWithOpacity(accent, 0.15),
            backgroundColor: accentWithOpacity(accent, 0.06),
        }
        : {};

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{
                opacity: 1,
                y: 0,
                boxShadow: showGlow ? ["0 0 0px rgba(34,197,94,0)", "0 0 12px rgba(34,197,94,0.25)", "0 0 0px rgba(34,197,94,0)"] : undefined,
            }}
            whileHover={{ y: -2 }}
            transition={{
                delay: index * 0.05,
                boxShadow: showGlow ? { duration: 1.5, ease: "easeInOut" } : undefined,
            }}
            className={`relative flex flex-col p-3 sm:p-5 rounded-xl border transition-all duration-300
        ${!isTop1 ? "bg-card border-border/30 hover:border-border/50" : ""}
      `}
            style={cardStyle}
        >
            <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <PositionBadge position={position} accentColor={branding?.accentColor} />
                    {deltaStatus && (
                        <PositionDelta status={deltaStatus} delta={delta ?? 0} isBiggestClimber={isBiggestClimber} />
                    )}

                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {athlete.avatar_url ? (
                            <img
                                src={athlete.avatar_url}
                                alt=""
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-border/30"
                            />
                        ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center border border-border/30">
                                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </div>
                        )}

                        <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-base font-bold text-foreground truncate">
                                {athlete.name}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                                {athlete.group_name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 text-right">
                    <TotalPointsHighlight points={athlete.total_points} isTop1={isTop1} branding={branding} />
                </div>
            </div>

            <WeeklyBreakdown details={athlete.workout_details || []} accentColor={branding?.accentColor} />
        </motion.div>
    );
});

RankingCard.displayName = "RankingCard";

export default RankingCard;
