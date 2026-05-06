/**
 * Extrai o primeiro valor percentual de strings como "75%", "75 %", "@70%".
 */
export function extractPercentFromLoadString(load: string | null | undefined): number | null {
  if (!load?.trim()) return null;
  const m = load.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (m) return parseFloat(m[1].replace(",", "."));
  const plain = load.match(/^(\d+(?:[.,]\d+)?)\s*$/);
  if (plain) return parseFloat(plain[1].replace(",", "."));
  return null;
}

export function kgFromPercent(percent: number, maxKg: number): number {
  return Math.round((maxKg * percent) / 100);
}

export type PercentSetPlan = {
  setIndex: number;
  rawLoad: string | null;
  percent: number | null;
  targetKg: number | null;
};

export function buildPercentSetPlan(
  setsCount: number,
  suggestedLoad: string | null,
  loadScheme: string[] | null | undefined,
  loadType: string | undefined,
  maxKg: number | null
): PercentSetPlan[] {
  const isPercent = loadType === "percent";
  return Array.from({ length: setsCount }, (_, idx) => {
    const raw = loadScheme?.[idx] ?? suggestedLoad ?? null;
    const percent = isPercent ? extractPercentFromLoadString(raw) : null;
    const targetKg =
      isPercent && percent != null && maxKg != null && maxKg > 0
        ? kgFromPercent(percent, maxKg)
        : null;
    return { setIndex: idx, rawLoad: raw, percent, targetKg };
  });
}
