import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { PERIOD_PHASES, type PeriodPhase } from "@/lib/training-periodization";

function parseLabelsJson(raw: unknown): Partial<Record<PeriodPhase, string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<PeriodPhase, string>> = {};
  for (const p of PERIOD_PHASES) {
    const v = (raw as Record<string, unknown>)[p];
    if (typeof v === "string" && v.trim()) out[p] = v.trim();
  }
  return out;
}

/**
 * Nomes da legenda personalizados pelo treinador.
 * - Vista aluno: passar `studentId` (resolve o treinador do aluno).
 * - Editor treinador: passar `trainerEditorId` (carrega/actualiza a própria linha).
 */
export function usePeriodPhaseLabels(args: {
  studentId: string | null | undefined;
  trainerEditorId: string | null | undefined;
}) {
  const [overrides, setOverrides] = useState<Partial<Record<PeriodPhase, string>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const tid = args.trainerEditorId;
    const sid = args.studentId;

    if (tid) {
      setLoading(true);
      const { data, error } = await supabase
        .from("trainer_periodization_settings")
        .select("period_phase_labels")
        .eq("trainer_id", tid)
        .maybeSingle();
      if (!error && data?.period_phase_labels) setOverrides(parseLabelsJson(data.period_phase_labels));
      else setOverrides({});
      setLoading(false);
      return;
    }

    if (sid) {
      setLoading(true);
      const { data: st, error: e1 } = await supabase.from("students").select("trainer_id").eq("id", sid).maybeSingle();
      if (e1 || !st?.trainer_id) {
        setOverrides({});
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("trainer_periodization_settings")
        .select("period_phase_labels")
        .eq("trainer_id", st.trainer_id)
        .maybeSingle();
      if (!error && data?.period_phase_labels) setOverrides(parseLabelsJson(data.period_phase_labels));
      else setOverrides({});
      setLoading(false);
      return;
    }

    setOverrides({});
    setLoading(false);
  }, [args.studentId, args.trainerEditorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (trainerId: string, next: Partial<Record<PeriodPhase, string>>) => {
    const { data: cur } = await supabase
      .from("trainer_periodization_settings")
      .select("period_phase_labels")
      .eq("trainer_id", trainerId)
      .maybeSingle();
    const existing = parseLabelsJson(cur?.period_phase_labels);
    const merged: Record<string, string> = { ...existing };
    for (const p of PERIOD_PHASES) {
      const v = next[p];
      if (v === undefined) continue;
      const t = v.trim();
      if (t) merged[p] = t;
      else delete merged[p];
    }
    const { error } = await supabase.from("trainer_periodization_settings").upsert(
      { trainer_id: trainerId, period_phase_labels: merged as Json },
      { onConflict: "trainer_id" },
    );
    if (error) throw error;
    setOverrides(parseLabelsJson(merged));
  };

  return { overrides, loading, refetch: load, save };
}
