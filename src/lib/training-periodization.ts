import { addWeeks, startOfWeek, format } from "date-fns";

/** Valores persistidos em `training_period_weeks.phase` */
export type PeriodPhase = "accumulation" | "transmutation" | "realization";

export const PERIOD_PHASES: PeriodPhase[] = ["accumulation", "transmutation", "realization"];

export const PHASE_LABELS_PT: Record<PeriodPhase, string> = {
  accumulation: "Acumulação (base)",
  transmutation: "Transmutação / Intensificação",
  realization: "Realização (competição)",
};

/** Rótulos curtos para células estreitas (grelha mobile) — evita sobreposição entre colunas */
export const PHASE_LABELS_COMPACT_PT: Record<PeriodPhase, string> = {
  accumulation: "Base",
  transmutation: "Intensif.",
  realization: "Competição",
};

/** Célula da semana: cor = período (a legenda explica o significado). */
export const PHASE_CELL_CLASSES: Record<PeriodPhase, string> = {
  accumulation:
    "border border-[#d7d3e0] bg-[#f1eef7] text-[#33214A]",
  transmutation:
    "border border-primary/25 bg-primary/10 text-primary",
  realization:
    "border border-[#d7c1a1] bg-[#efe4d4] text-[#8a5a1f]",
};

/** Quadrado da legenda (sem depender de split de classes). */
export const PHASE_LEGEND_SWATCH: Record<PeriodPhase, string> = {
  accumulation: "border border-[#d7d3e0] bg-[#f1eef7]",
  transmutation: "border border-primary/25 bg-primary/10",
  realization: "border border-[#d7c1a1] bg-[#efe4d4]",
};

export function normalizeWeekStartMonday(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

export function toISODateString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Nome da fase: override do treinador ou rótulo por defeito. */
export function resolvePhaseLabel(
  phase: PeriodPhase,
  overrides: Partial<Record<PeriodPhase, string>> | null | undefined,
): string {
  const o = overrides?.[phase]?.trim();
  if (o) return o;
  return PHASE_LABELS_PT[phase];
}

/** Gera N semanas consecutivas a partir de uma segunda-feira âncora. */
export function buildWeekSequence(anchorMonday: Date, count: number): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    out.push(addWeeks(anchorMonday, i));
  }
  return out;
}
