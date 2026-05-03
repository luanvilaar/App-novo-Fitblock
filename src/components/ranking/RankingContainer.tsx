import React, { useMemo } from "react";
import RankingCard from "./RankingCard";
import { motion } from "framer-motion";
import { computePositionDelta } from "./PositionDelta";
import type { BoxBranding } from "@/hooks/useBoxBranding";

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

interface RankingContainerProps {
    ranking: RankedAthlete[];
    weekLabel?: string;
    branding?: BoxBranding | null;
}

const RankingContainer: React.FC<RankingContainerProps> = ({ ranking, weekLabel, branding }) => {
    // Compute position deltas for all athletes
    const deltas = useMemo(() => {
        const results = ranking.map((athlete) => computePositionDelta(athlete.workout_details || []));
        // Find biggest climber
        let maxClimb = 0;
        let biggestClimberIdx = -1;
        results.forEach((r, i) => {
            if (r.status === "up" && r.delta > maxClimb) {
                maxClimb = r.delta;
                biggestClimberIdx = i;
            }
        });
        return { results, biggestClimberIdx };
    }, [ranking]);

    if (ranking.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            {/* Box branding header */}
            {branding && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-center gap-3 mb-4"
                >
                    {branding.logo_url && (
                        <img
                            src={branding.logo_url}
                            alt={branding.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain"
                        />
                    )}
                    <span
                        className="text-lg sm:text-xl font-light tracking-tight uppercase"
                        style={{ color: branding.accentColor }}
                    >
                        {branding.name}
                    </span>
                </motion.div>
            )}

            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
            >
                <h2 className="text-2xl sm:text-4xl font-light tracking-tight mb-3 text-foreground uppercase">
                    Ranking{" "}
                    <span style={branding ? { color: branding.accentColor } : undefined} className={!branding ? "text-primary" : ""}>
                        Semanal
                    </span>
                </h2>
                {weekLabel && (
                    <p
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2"
                        style={branding ? { color: branding.accentColor } : undefined}
                    >
                        {!branding && <span className="text-primary">{weekLabel}</span>}
                        {branding && weekLabel}
                    </p>
                )}
                <p className="text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-widest">
                    Menor pontuação acumulada = melhor posição
                </p>
            </motion.div>

            {/* Cards List */}
            <div className="flex flex-col gap-2">
                {ranking.map((athlete, index) => (
                    <RankingCard
                        key={athlete.student_id}
                        athlete={athlete}
                        index={index}
                        branding={branding}
                        deltaStatus={deltas.results[index]?.status}
                        delta={deltas.results[index]?.delta ?? 0}
                        isBiggestClimber={index === deltas.biggestClimberIdx}
                    />
                ))}
            </div>
        </div>
    );
};

export default RankingContainer;
