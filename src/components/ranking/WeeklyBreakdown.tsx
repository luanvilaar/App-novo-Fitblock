import React from "react";
import { accentWithOpacity } from "@/utils/colorUtils";

interface WorkoutDetail {
    workout_id: string;
    score_raw: string;
    position: number;
    points: number;
}

interface WeeklyBreakdownProps {
    details: WorkoutDetail[];
    accentColor?: string;
}

const WeeklyBreakdown: React.FC<WeeklyBreakdownProps> = React.memo(({ details, accentColor }) => {
    const days = ["SEG", "TER", "QUA", "QUI", "SEX"];
    const accent = accentColor || "hsl(var(--primary))";

    return (
        <div className="flex gap-1.5 sm:gap-2 mt-2.5 sm:mt-4 w-full overflow-x-auto">
            {days.map((day, index) => {
                const detail = details[index];
                const hasScore = detail && detail.workout_id !== "" && detail.score_raw !== "" && detail.score_raw !== "—";
                const hasWorkout = detail && detail.workout_id !== "";

                return (
                    <div
                        key={day}
                        className={`flex flex-col flex-1 min-w-[52px] px-2 py-1.5 rounded-lg border transition-all duration-300
              ${!hasWorkout ? "bg-muted/20 border-border/20 opacity-40" : ""}
            `}
                        style={hasWorkout ? {
                            backgroundColor: accentWithOpacity(accent, 0.08),
                            borderColor: accentWithOpacity(accent, 0.15),
                        } : undefined}
                    >
                        <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">{day}</span>
                        <div className="flex items-baseline justify-between gap-0.5">
                            <span
                                className={`text-xs sm:text-[13px] font-black leading-none ${!hasWorkout ? "text-muted-foreground" : ""}`}
                                style={hasWorkout ? { color: accent } : undefined}
                            >
                                {hasWorkout ? detail.points : "–"}
                            </span>
                            {hasScore && (
                                <span className="text-[9px] sm:text-[10px] font-semibold truncate max-w-[35px] sm:max-w-[45px] text-muted-foreground">
                                    {detail.score_raw}
                                </span>
                            )}
                            {hasWorkout && !hasScore && (
                                <span className="text-[9px] text-muted-foreground/50 font-medium">—</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

WeeklyBreakdown.displayName = "WeeklyBreakdown";

export default WeeklyBreakdown;
