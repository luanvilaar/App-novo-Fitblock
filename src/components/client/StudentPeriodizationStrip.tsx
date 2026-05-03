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

const PHASE_TIMELINE_CARD: Record<PeriodPhase, string> = {
  accumulation: "border-[#d7d3e0] bg-[#f1eef7]",
  transmutation: "border-primary/25 bg-primary/10",
  realization: "border-[#d7c1a1] bg-[#efe4d4]",
};

const PHASE_TIMELINE_TEXT: Record<PeriodPhase, string> = {
  accumulation: "text-[#5a5270]",
  transmutation: "text-primary",
  realization: "text-[#8a5a1f]",
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
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4 sm:gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/65 transition-colors hover:border-primary/20 hover:text-foreground"
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/65 transition-colors hover:border-primary/20 hover:text-foreground"
            aria-label="Semanas seguintes"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {canEdit && trainerEditorId ? (
          <div className="space-y-4 rounded-xl border border-border bg-background p-5">
            <div>
              <p className="font-display text-xl font-normal tracking-[-0.03em] text-foreground">Nomes da legenda</p>
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
                    <Label htmlFor={`phase-label-${p}`} className="text-[10px] text-muted-foreground">
                      {PHASE_I18N_HINT[p]}
                    </Label>
                  </div>
                  <Input
                    id={`phase-label-${p}`}
                    value={labelDraft[p]}
                    onChange={(e) => setLabelDraft((prev) => ({ ...prev, [p]: e.target.value }))}
                    placeholder={PHASE_LABELS_PT[p]}
                    className="h-10 rounded-lg border-border bg-card text-sm text-foreground"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onSaveLabels()}
                disabled={savingLabels}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {savingLabels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Guardar nomes
              </button>
              <button
                type="button"
                onClick={() => void onResetLabels()}
                disabled={savingLabels}
                className="h-9 rounded-lg border border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground disabled:opacity-50"
              >
                Repor padrão
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="h-28 animate-pulse rounded-xl border border-border bg-background" />
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-display text-xl font-normal tracking-[-0.03em] text-foreground">Linha do mesociclo</p>
                  <p className="text-xs text-muted-foreground">
                    {canEdit
                      ? "Defina a fase de cada semana nesta sequência. Em mobile, deslize horizontalmente."
                      : "Deslize para navegar pelas semanas do ciclo."}
                  </p>
                </div>
                <span className="hidden rounded-full border border-border bg-background px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
                  {rows.length} semanas carregadas
                </span>
              </div>

              <div className="relative -mx-1 overflow-hidden px-1">
                <div className="pointer-events-none absolute left-3 right-3 top-[2.05rem] hidden h-px bg-border sm:block" />
                <div className="grid auto-cols-[minmax(9.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory sm:auto-cols-fr sm:overflow-visible sm:pb-0">
                  {weekDates.map((d) => {
                    const iso = toISODateString(d);
                    const phase = phaseByWeek.get(iso);
                    const resolvedPhaseLabel = phase ? resolvePhaseLabel(phase, phaseLabelOverrides) : "Sem fase";
                    const weekButtonLabel = phase
                      ? `Semana de ${format(d, "d 'de' MMM", { locale: ptBR })}, ${resolvedPhaseLabel}`
                      : `Semana de ${format(d, "d 'de' MMM", { locale: ptBR })}, sem período atribuído`;

                    const HeaderComp = canEdit ? "div" : "button";

                    return (
                      <div key={iso} className="min-w-0 snap-start">
                        <div
                          className={cn(
                            "flex min-h-[12.5rem] flex-col rounded-xl border bg-card p-3 sm:min-h-[13rem] sm:p-3.5",
                            phase ? PHASE_TIMELINE_CARD[phase] : "border-border bg-card",
                          )}
                        >
                          <HeaderComp
                            {...(!canEdit
                              ? {
                                  type: "button",
                                  onClick: () => onWeekSelect?.(d),
                                  "aria-label": weekButtonLabel,
                                  title: phase ? resolvedPhaseLabel : "Sem fase atribuída",
                                }
                              : {})}
                            className={cn(
                              "text-left",
                              !canEdit && onWeekSelect ? "cursor-pointer transition-transform active:scale-[0.98]" : "",
                            )}
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span
                                className={cn(
                                  "inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[8px] uppercase tracking-[0.14em]",
                                  phase
                                    ? `${PHASE_TIMELINE_TEXT[phase]} bg-white/55 border-current/15`
                                    : "border-border bg-background text-muted-foreground",
                                )}
                              >
                                {format(d, "EEE", { locale: ptBR }).replace(".", "").slice(0, 3)}
                              </span>
                              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                                {format(d, "dd/MM")}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <p className="font-display text-[1.9rem] font-normal leading-none tracking-[-0.05em] text-foreground">
                                {format(d, "dd")}
                              </p>
                              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                                semana {format(d, "II")}
                              </p>
                            </div>
                          </HeaderComp>

                          <div className="mt-auto space-y-3 pt-5">
                            {canEdit ? (
                              <Select value={phase ?? "none"} onValueChange={(v) => void onChangePhase(iso, v)}>
                                <SelectTrigger
                                  className={cn(
                                    "h-10 min-w-0 rounded-lg border bg-white/70 px-3 text-left text-[9px] font-mono uppercase tracking-[0.12em]",
                                    phase ? "border-current/15 text-foreground" : "border-border text-foreground/50",
                                  )}
                                >
                                  <span className="inline-flex w-full min-w-0 items-center gap-2">
                                    {phase ? (
                                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", PHASE_LEGEND_SWATCH[phase])} />
                                    ) : null}
                                    <SelectValue placeholder="Fase" />
                                  </span>
                                </SelectTrigger>
                                <SelectContent className="border-border bg-card">
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
                            ) : (
                              <div
                                className={cn(
                                  "rounded-lg border px-3 py-2",
                                  phase ? "border-current/15 bg-white/60" : "border-border bg-background",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {phase ? (
                                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", PHASE_LEGEND_SWATCH[phase])} />
                                  ) : null}
                                  <span className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/75">
                                    {resolvedPhaseLabel}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {!editable && !hasAnyPhase && (
              <p className="rounded-xl border border-border bg-background px-6 py-6 text-center font-body text-sm text-muted-foreground">
                O seu treinador ainda não definiu fases para estas semanas.
              </p>
            )}

            <div
              className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-2"
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
