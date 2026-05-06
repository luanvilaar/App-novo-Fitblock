export interface WorkoutDetail {
    workout_id: string;
    score_raw: string;
    position: number;
    points: number;
}

export interface RankedAthlete {
    student_id: string;
    name: string;
    avatar_url?: string | null;
    group_name: string;
    workout_details: WorkoutDetail[];
    total_points: number;
}

/**
 * Sorts athletes according to the weekly ranking business rules:
 * 1. Lower total points = better position.
 * 2. Tie-breaker: Better placement (lower number) in the most recent workout of the week.
 */
export const sortWeeklyRanking = (athletes: RankedAthlete[]): RankedAthlete[] => {
    return [...athletes].sort((a, b) => {
        // Rule 1: Total points (Lower is better)
        if (a.total_points !== b.total_points) {
            return a.total_points - b.total_points;
        }

        // Rule 2: Tie-breaker (Most recent workout performance)
        const detailsA = a.workout_details || [];
        const detailsB = b.workout_details || [];

        // Check from Friday (index 4) down to Monday (index 0)
        for (let i = 4; i >= 0; i--) {
            const posA = detailsA[i]?.position ?? 999; // 999 if no participation
            const posB = detailsB[i]?.position ?? 999;

            if (posA !== posB) {
                return posA - posB; // Better position (1st < 2nd)
            }
        }

        return 0;
    });
};
