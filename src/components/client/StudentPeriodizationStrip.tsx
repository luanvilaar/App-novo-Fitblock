import { useCallback, useEffect, useMemo, useState } from "react";
import { addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrainerPanelCard } from "@/components/trainer/TrainerPanelCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  buildWeekSequence,
  normalizeWeekStartMonday,
  PERIOD_PHASES,
  PHASE_CELL_CLASSES,
  PHASE_LABELS_PT,
  PHASE_LEGEND_SWATCH,
  resolvePhaseLabel,
  toISODateString,
  type PeriodPhase,
} from "@/lib/training-periodization";
import { usePeriodPhaseLabels } from "@/hooks/usePeriodPhaseLabels";
import {
  useMergedPeriodWeeksForStudent,
  useScopedPeriodWeeks,
  type PeriodWeekScope,
} from "@/hooks/useTrainingPeriodWeeks";
import { supabase } from "@/integrations/supabase/client";

const WEEKS_PER_PAGE = 10;

type Props = {
  /** Dashboard do aluno (leitura) ou edição no contexto atleta */
  studentId?: string | null;
  /** Edição no contexto grupo */
  groupId?: string | null;
  /** Treinador logado: para carregar e editar nomes custom da legenda */
  trainerEditorId?: string | null;
  editable?: boolean;
  onWeekSelect?: (weekStart: Date) => void;
};

const PHASE_I18N_HINT: Record<PeriodPhase, string> = {
  accumulation: "Fase de base (cinza na grelha)",
  transmutation: "Fase roxa (intensificação / transmutação)",
  realization: "Fase laranja (competição / realização)",
};

export function StudentPeriodizationStrip({
  studentId = null,
  groupId = null,
  trainerEditorId = null,
  editable = false,
  onWeekSelect,
}: Props) {
  const [page, setPage] = useState(0);
  const [refMonday] = useState(() => normalizeWeekStartMonday(new Date()));

  const firstMonday = useMemo(() => addWeeks(refMonday, page * WEEKS_PER_PAGE), [refMonday, page]);
  const weekDates = useMemo(() => buildWeekSequence(firstMonday, WEEKS_PER_PAGE), [firstMonday]);
  const weekStartKeys = useMemo(() => weekDates.map((d) => toISODateString(d)), [weekDates]);

  const scope: PeriodWeekScope | null = useMemo(() => {
    if (!editable) return null;
    if (groupId) return { kind: "group", groupId };
    if (studentId) return { kind: "student", studentId };
    return null;
  }, [editable, groupId, studentId]);

  const scoped = useScopedPeriodWeeks(scope, weekStartKeys);
  const merged = useMergedPeriodWeeksForStudent(editable ? null : studentId, weekStartKeys);

  const rows = editable ? scoped.rows : merged.rows;
  const loading = editable ? scoped.loading : merged.loading;
  const { upsertPhase, clearWeek } = scoped;

  const { overrides: phaseLabelOverrides, save: savePhaseLabels, refetch: refetchPhaseLabels } =
    usePeriodPhaseLabels({
      studentId: editable ? null : studentId,
      trainerEditorId: editable ? trainerEditorId : null,
    });

  const [labelDraft, setLabelDraft] = useState<Record<PeriodPhase, string>>({
    accumulation: "",
    transmutation: "",
    realization: "",
  });
  const [savingLabels, setSavingLabels] = useState(false);

  useEffect(() => {
    if (!editable || !trainerEditorId) return;
    setLabelDraft({
      accumulation: phaseLabelOverrides.accumulation ?? "",
      transmutation: phaseLabelOverrides.transmutation ?? "",
      realization: phaseLabelOverrides.realization ?? "",
    });
  }, [phaseLabelOverrides, editable, trainerEditorId]);

  const onSaveLabels = useCallback(async () => {
    if (!trainerEditorId) return;
    setSavingLabels(true);
    try {
      await savePhaseLabels(trainerEditorId, {
        accumulation: labelDraft.accumulation,
        transmutation: labelDraft.transmutation,
        realization: labelDraft.realization,
      });
      toast.success("Nomes da legenda actualizados");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar";
      toast.error(msg);
    } finally {
      setSavingLabels(false);
    }
  }, [trainerEditorId, labelDraft, savePhaseLabels]);

  const onResetLabels = useCallback(async () => {
    if (!trainerEditorId) return;
    setSavingLabels(true);
    try {
      const { error } = await supabase
        .from("trainer_periodization_settings")
        .delete()
        .eq("trainer_id", trainerEditorId);
      if (error) throw error;
      setLabelDraft({ accumulation: "", transmutation: "", realization: "" });
      await refetchPhaseLabels();
      toast.success("Nomes repostos para o padrão FitBlock");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error(msg);
    } finally {
      setSavingLabels(false);
    }
  }, [trainerEditorId, refetchPhaseLabels]);

  const phaseByWeek = useMemo(() => {
    const m = new Map<string, PeriodPhase>();
    for (const r of rows) {
      if (PERIOD_PHASES.includes(r.phase as PeriodPhase)) {
        m.set(r.week_start, r.phase as PeriodPhase);
      }
    }
    return m;
  }, [rows]);

  const hasAnyPhase = rows.length > 0;

  const canEdit = Boolean(editable && scope);

  const onChangePhase = async (iso: string, value: string) => {
    if (!canEdit) return;
    try {
      if (value === "none") {
        await clearWeek(iso);
        toast.success("Semana limpa");
      } else {
        await upsertPhase(iso, value as PeriodPhase);
        toast.success("Fase guardada");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar";
      toast.error(msg);
    }
  };

  const subtitle = useMemo(() => {
    if (!editable) return "Blocos de preparação definidos pelo seu treinador.";
    if (groupId) return "Defina a fase de cada semana (segunda a domingo). Os alunos do grupo veem o mesmo calendário no dashboard.";
    return "Defina a fase de cada semana (segunda a domingo). O aluno vê o mesmo calendário no dashboard.";
  }, [editable, groupId]);

  return (
    <TrainerPanelCard compact eyebrow="Periodização" title="Mesociclo em semanas" subtitle={subtitle}>
      <div className="mt-1 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-4 sm:gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] text-white/75 transition-colors hover:border-white/35 hover:bg-white/[0.08] hover:text-white"
            aria-label="Semanas anteriores"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
            {format(firstMonday, "dd MMM", { locale: ptBR })} —{" "}
            {format(weekDates[WEEKS_PER_PAGE - 1]!, "dd MMM yyyy", { locale: ptBR })}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] text-white/75 transition-colors hover:border-white/35 hover:bg-white/[0.08] hover:text-white"
            aria-label="Semanas seguintes"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {canEdit && trainerEditorId ? (
          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div>
              <p className="font-body text-sm font-semibold text-white">Nomes da legenda</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                As semanas usam a cor de cada período; o texto abaixo personaliza a legenda (opcional). Deixe em branco
                para o padrão FitBlock.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PERIOD_PHASES.map((p) => (
                <div key={p} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 shrink-0 rounded-sm", PHASE_LEGEND_SWATCH[p])} aria-hidden />
                    <Label htmlFor={`phase-label-${p}`} className="text-[10px] font-medium text-muted-foreground">
                      {PHASE_I18N_HINT[p]}
                    </Label>
                  </div>
                  <Input
                    id={`phase-label-${p}`}
                    value={labelDraft[p]}
                    onChange={(e) => setLabelDraft((prev) => ({ ...prev, [p]: e.target.value }))}
                    placeholder={PHASE_LABELS_PT[p]}
                    className="h-10 border-white/10 bg-[#0f0f0f] text-sm text-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onSaveLabels()}
                disabled={savingLabels}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/20 px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
              >
                {savingLabels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Guardar nomes
              </button>
              <button
                type="button"
                onClick={() => void onResetLabels()}
                disabled={savingLabels}
                className="h-9 rounded-lg border border-white/10 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Repor padrão
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-[#0a0a0a]" />
        ) : (
          <>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-1.5 md:gap-2">
              {weekDates.map((d) => {
                const iso = toISODateString(d);
                const phase = phaseByWeek.get(iso);
                const weekButtonLabel = phase
                  ? `Semana de ${format(d, "d 'de' MMM", { locale: ptBR })}, ${resolvePhaseLabel(phase, phaseLabelOverrides)}`
                  : `Semana de ${format(d, "d 'de' MMM", { locale: ptBR })}, sem período atribuído`;
                return (
                  <div key={iso} className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
                    {canEdit ? (
                      <>
                        <div
                          className={cn(
                            "rounded-xl px-0.5 py-1.5 text-center sm:px-1 sm:py-2",
                            phase ? PHASE_CELL_CLASSES[phase] : "border border-white/10 bg-[#0c0c0c] text-white/45",
                          )}
                          aria-hidden
                        >
                          <p className="font-mono text-[6px] uppercase leading-none tracking-wider opacity-80 sm:text-[7px]">
                            {format(d, "EEE", { locale: ptBR })
                              .replace(".", "")
                              .slice(0, 3)}
                          </p>
                          <p className="font-display text-xs font-bold tabular-nums sm:text-sm">
                            {format(d, "dd")}
                          </p>
                        </div>
                        <Select value={phase ?? "none"} onValueChange={(v) => void onChangePhase(iso, v)}>
                          <SelectTrigger
                            className={cn(
                              "h-8 min-w-0 border bg-[#141414] px-1 text-left text-[8px] font-mono uppercase tracking-wide sm:text-[9px]",
                              phase
                                ? "border-white/20 text-white/90"
                                : "border-white/10 text-white/50",
                            )}
                          >
                            <span className="inline-flex w-full min-w-0 items-center gap-1.5">
                              {phase ? (
                                <span className={cn("h-2 w-2 shrink-0 rounded-sm", PHASE_LEGEND_SWATCH[phase])} />
                              ) : null}
                              <SelectValue placeholder="Fase" />
                            </span>
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-[#1a1a1a]">
                            <SelectItem value="none" className="font-mono text-xs">
                              Sem fase
                            </SelectItem>
                            {PERIOD_PHASES.map((p) => (
                              <SelectItem key={p} value={p} className="text-xs">
                                {resolvePhaseLabel(p, phaseLabelOverrides)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onWeekSelect?.(d)}
                        className={cn(
                          "w-full rounded-xl px-0.5 py-1.5 text-center sm:px-1 sm:py-2",
                          phase
                            ? PHASE_CELL_CLASSES[phase]
                            : "border border-white/10 bg-[#0c0c0c] text-white/45",
                          onWeekSelect && "cursor-pointer transition-transform active:scale-[0.98]",
                          !onWeekSelect && "cursor-default",
                        )}
                        aria-label={weekButtonLabel}
                        title={phase ? resolvePhaseLabel(phase, phaseLabelOverrides) : "Sem fase atribuída"}
                      >
                        <p className="font-mono text-[6px] uppercase leading-none tracking-wider opacity-80 sm:text-[7px]">
                          {format(d, "EEE", { locale: ptBR })
                            .replace(".", "")
                            .slice(0, 3)}
                        </p>
                        <p className="font-display text-xs font-bold tabular-nums sm:text-sm">{format(d, "dd")}</p>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!editable && !hasAnyPhase && (
              <p className="text-center font-body text-sm text-muted-foreground">
                O seu treinador ainda não definiu fases para estas semanas.
              </p>
            )}

            <div
              className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-2"
              role="list"
            >
              {PERIOD_PHASES.map((p) => (
                <div key={p} className="flex min-w-0 items-start gap-2.5 sm:gap-2" role="listitem">
                  <span
                    className={cn("mt-0.5 h-3 w-3 shrink-0 rounded-sm", PHASE_LEGEND_SWATCH[p])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 font-body text-[11px] leading-snug text-muted-foreground sm:leading-snug">
                    {resolvePhaseLabel(p, phaseLabelOverrides)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TrainerPanelCard>
  );
}
