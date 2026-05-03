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
    <div className="space-y-6">
      {isPercent && percentPlan.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-tight text-white">Intensidade (%)</p>
              <p className="font-body text-[11px] text-white/45">
                {hasReferenceMax ? "Meta por série com base na tua referência." : "Define a referência (1RM) para ver kg sugeridos."}
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-1">
            {percentPlan.map((row) => {
              const barW =
                row.percent != null ? Math.min(100, (row.percent / maxPercentAmongSets) * 100) : 0;
              return (
                <div
                  key={`ladder-${exerciseId}-${row.setIndex}`}
                  className="group flex min-w-0 items-center gap-3"
                >
                  <span className="w-8 shrink-0 text-center font-mono text-xs font-bold text-white/25 transition-colors group-hover:text-primary">
                    {String(row.setIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-1.5 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ duration: 0.5, delay: row.setIndex * 0.05 }}
                        className="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(65,31,128,0.35)]"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
                      <span className="text-white/35">{row.percent != null ? `${row.percent}%` : "—"}</span>
                      <span className="tabular-nums text-primary">
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

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-3 md:px-4 md:py-3.5">
          <div className="col-span-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">
            Série
          </div>
          <div className="col-span-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">
            Reps
          </div>
          <div className="col-span-4 text-center font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">
            Carga (kg)
          </div>
          <div className="col-span-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">
            Ok
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
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
                  "grid grid-cols-12 items-center gap-2 px-3 py-3 transition-colors duration-300 md:px-4 md:py-4",
                  set.is_completed ? "bg-primary/[0.07]" : "bg-transparent",
                )}
              >
                <div className="col-span-2 text-center">
                  <span
                    className={cn(
                      "font-display text-2xl font-bold transition-colors duration-300",
                      set.is_completed ? "text-primary" : "text-white/25",
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
                    className="h-11 rounded-lg border-white/10 bg-black/50 text-center font-display text-lg font-bold text-white focus:border-primary md:h-12 md:text-xl"
                    inputMode="numeric"
                  />
                </div>

                <div className="col-span-4 min-w-0">
                  <div className="group/input relative">
                    <Input
                      type="number"
                      placeholder={kgPlaceholder || (isPercent ? "—" : "—")}
                      value={set.load_used ?? ""}
                      onChange={(e) =>
                        onUpdateSet(idx, "load_used", e.target.value ? Number(e.target.value) : null)
                      }
                      className={cn(
                        "h-11 rounded-lg border-white/10 bg-black/50 pr-8 text-center font-display text-lg font-bold transition-colors focus:border-primary md:h-12 md:text-xl",
                        set.is_completed ? "text-white" : "text-white",
                      )}
                      inputMode="decimal"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8px] font-bold uppercase tracking-widest text-white/30">
                      kg
                    </span>
                  </div>
                </div>

                <div className="col-span-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(idx)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all active:scale-95 md:h-12 md:w-12",
                      set.is_completed
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(65,31,128,0.35)]"
                        : "border-white/12 bg-black/40 text-white/15 hover:border-primary/40 hover:text-primary/70",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-6 w-6 transition-all duration-300 md:h-7 md:w-7",
                        set.is_completed ? "scale-100 opacity-100" : "scale-90 opacity-25",
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
