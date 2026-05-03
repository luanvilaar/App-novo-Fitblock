import { Check, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import type { PercentSetPlan } from "@/lib/load-percent";
import { cn } from "@/lib/utils";

export interface PremiumSetLog {
  set_number: number;
  reps_done: number | null;
  load_used: number | null;
  notes?: string;
  is_completed?: boolean;
}

interface ExecutionGridPremiumProps {
  sets: PremiumSetLog[];
  suggestedReps?: string;
  suggestedRepsBySet?: string[];
  /** Modo de prescrição de carga */
  loadPrescriptionMode?: "kg" | "percent";
  /** Plano por série (% e kg alvo) — só modo percent */
  percentPlan?: PercentSetPlan[];
  /** Há 1RM/referência cadastrada (afeta cópias e empty states) */
  hasReferenceMax?: boolean;
  suggestedLoad?: string | null;
  suggestedLoadBySet?: string[];
  exerciseId: string;
  onUpdateSet: (setIdx: number, field: keyof PremiumSetLog, value: unknown) => void;
  onToggleComplete: (setIdx: number) => void;
}

const ExecutionGridPremium = ({
  sets,
  suggestedReps,
  suggestedRepsBySet,
  loadPrescriptionMode = "kg",
  percentPlan = [],
  hasReferenceMax = false,
  suggestedLoad,
  suggestedLoadBySet,
  exerciseId,
  onUpdateSet,
  onToggleComplete,
}: ExecutionGridPremiumProps) => {
  const isPercent = loadPrescriptionMode === "percent";
  const maxPercentAmongSets = Math.max(
    1,
    ...percentPlan.map((p) => (p.percent != null ? p.percent : 0))
  );

  return (
    <div className="space-y-8">
      {isPercent && percentPlan.length > 0 && (
        <div className="space-y-5 rounded-2xl bg-black p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-sans text-sm font-bold uppercase tracking-tight">Intensidade (%)</p>
              <p className="font-sans text-[11px] opacity-40">
                {hasReferenceMax ? "Meta calculada por série." : "Defina 1RM para ver kg sugeridos."}
              </p>
            </div>
          </div>
          <div className="space-y-5 pt-1">
            {percentPlan.map((row) => {
              const barW =
                row.percent != null ? Math.min(100, (row.percent / maxPercentAmongSets) * 100) : 0;
              return (
                <div
                  key={`ladder-${exerciseId}-${row.setIndex}`}
                  className="group flex min-w-0 items-center gap-4"
                >
                  <span className="w-6 shrink-0 text-center font-mono text-[10px] font-bold opacity-30">
                    {String(row.setIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ duration: 0.6, delay: row.setIndex * 0.05 }}
                        className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-2 font-mono text-[9px] font-bold uppercase tracking-wider">
                      <span className="opacity-30">{row.percent != null ? `${row.percent}%` : "—"}</span>
                      <span className="text-white">
                        {row.targetKg != null ? `~${row.targetKg} kg` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-12 gap-2 border-b border-black/5 bg-[#fcfcfc] px-4 py-3">
          <div className="col-span-2 text-center font-mono text-[9px] font-bold uppercase tracking-[1.4px] text-black/40">
            Série
          </div>
          <div className="col-span-3 text-center font-mono text-[9px] font-bold uppercase tracking-[1.4px] text-black/40">
            Reps
          </div>
          <div className="col-span-4 text-center font-mono text-[9px] font-bold uppercase tracking-[1.4px] text-black/40">
            Carga
          </div>
          <div className="col-span-3 text-center font-mono text-[9px] font-bold uppercase tracking-[1.4px] text-black/40">
            Ok
          </div>
        </div>

        <div className="divide-y divide-black/5">
          {sets.map((set, idx) => {
            const planRow = percentPlan[idx];
            const targetPlaceholder =
              isPercent && planRow?.targetKg != null ? String(planRow.targetKg) : undefined;
            const kgPlaceholder =
              targetPlaceholder ??
              (!isPercent ? suggestedLoadBySet?.[idx] || suggestedLoad || "-" : undefined);

            return (
              <motion.div
                key={`${exerciseId}-set-${idx}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  "grid grid-cols-12 items-center gap-2 px-4 py-4 transition-all",
                  set.is_completed ? "bg-[#fcfcfc]" : "bg-white",
                )}
              >
                <div className="col-span-2 text-center">
                  <span
                    className={cn(
                      "font-sans text-2xl font-bold transition-all",
                      set.is_completed ? "text-black" : "text-black/10",
                    )}
                  >
                    {idx + 1}
                  </span>
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder={String(suggestedRepsBySet?.[idx] || suggestedReps || "")}
                    value={set.reps_done ?? ""}
                    onChange={(e) =>
                      onUpdateSet(idx, "reps_done", e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-12 rounded-full border-black/5 bg-[#f3f3f3] text-center font-sans text-lg font-bold text-black focus:border-black/10"
                    inputMode="numeric"
                  />
                </div>

                <div className="col-span-4 min-w-0">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={kgPlaceholder || "—"}
                      value={set.load_used ?? ""}
                      onChange={(e) =>
                        onUpdateSet(idx, "load_used", e.target.value ? Number(e.target.value) : null)
                      }
                      className="h-12 rounded-full border-black/5 bg-[#f3f3f3] pr-6 text-center font-sans text-lg font-bold text-black focus:border-black/10"
                      inputMode="decimal"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[7px] font-bold uppercase opacity-30">
                      kg
                    </span>
                  </div>
                </div>

                <div className="col-span-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(idx)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90",
                      set.is_completed
                        ? "bg-black text-white shadow-lg"
                        : "bg-[#f3f3f3] text-black/10 hover:text-black/40",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-6 w-6 transition-transform",
                        set.is_completed ? "scale-110" : "scale-100",
                      )}
                      strokeWidth={3}
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExecutionGridPremium;
