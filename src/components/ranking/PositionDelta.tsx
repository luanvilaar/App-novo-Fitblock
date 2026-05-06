import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DeltaStatus = "up" | "down" | "same" | "new";

interface PositionDeltaProps {
  status: DeltaStatus;
  delta: number;
  isBiggestClimber?: boolean;
}

const TriangleUp = () => (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="none" className="shrink-0">
    <polygon points="4,0 8,7 0,7" fill="currentColor" />
  </svg>
);

const TriangleDown = () => (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="none" className="shrink-0">
    <polygon points="4,7 8,0 0,0" fill="currentColor" />
  </svg>
);

const PositionDelta: React.FC<PositionDeltaProps> = React.memo(
  ({ status, delta, isBiggestClimber }) => {
    const tooltipText = (() => {
      if (status === "new") return "Novo no ranking hoje";
      if (status === "up") return `Subiu ${delta} ${delta === 1 ? "posição" : "posições"} em relação a ontem`;
      if (status === "down") return `Caiu ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "posição" : "posições"} em relação a ontem`;
      return "Mesma posição de ontem";
    })();

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-0.5 cursor-default"
            >
              {status === "new" && (
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  NEW
                </motion.span>
              )}

              {status === "up" && (
                <motion.span
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="inline-flex items-center gap-0.5 text-green-500"
                >
                  <TriangleUp />
                  <span className="text-[9px] sm:text-[10px] font-black tabular-nums">
                    +{delta}
                  </span>
                  {isBiggestClimber && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-0.5"
                    >
                      <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                    </motion.span>
                  )}
                </motion.span>
              )}

              {status === "down" && (
                <motion.span
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="inline-flex items-center gap-0.5 text-red-500"
                >
                  <TriangleDown />
                  <span className="text-[9px] sm:text-[10px] font-black tabular-nums">
                    {delta}
                  </span>
                </motion.span>
              )}

              {status === "same" && (
                <span className="inline-flex items-center text-muted-foreground">
                  <svg width="10" height="2" viewBox="0 0 10 2" className="shrink-0">
                    <rect x="0" y="0" width="10" height="2" rx="1" fill="currentColor" />
                  </svg>
                </span>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

PositionDelta.displayName = "PositionDelta";

export default PositionDelta;

/**
 * Computes the delta status for an athlete by comparing
 * their position on the most recent day vs the previous day.
 */
export function computePositionDelta(
  workoutDetails: { workout_id: string; position: number }[]
): { status: DeltaStatus; delta: number } {
  // Find the latest day with a valid workout
  let latestIdx = -1;
  for (let i = 4; i >= 0; i--) {
    if (workoutDetails[i]?.workout_id && workoutDetails[i].workout_id !== "") {
      latestIdx = i;
      break;
    }
  }

  if (latestIdx < 0) return { status: "same", delta: 0 };

  // Find the previous day with a valid workout
  let prevIdx = -1;
  for (let i = latestIdx - 1; i >= 0; i--) {
    if (workoutDetails[i]?.workout_id && workoutDetails[i].workout_id !== "") {
      prevIdx = i;
      break;
    }
  }

  // No previous day → new in ranking
  if (prevIdx < 0) {
    return latestIdx === 0
      ? { status: "same", delta: 0 } // Monday = first day, no comparison
      : { status: "new", delta: 0 };
  }

  const diff = workoutDetails[prevIdx].position - workoutDetails[latestIdx].position;

  if (diff > 0) return { status: "up", delta: diff };
  if (diff < 0) return { status: "down", delta: diff };
  return { status: "same", delta: 0 };
}
