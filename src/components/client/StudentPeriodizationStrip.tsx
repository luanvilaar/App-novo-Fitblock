import { useCallback, useEffect, useMemo, useState } from "react";
import { addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Loader2, PencilLine, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { TrainerPanelCard } from "@/components/trainer/TrainerPanelCard";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  buildWeekSequence,
  normalizeWeekStartMonday,
  PERIOD_PHASES,
  PHASE_CELL_CLASSES,
  PHASE_LABELS_COMPACT_PT,
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

const WEEKS_PER_PAGE = 12;

type Props = {
  studentId?: string | null;
  groupId?: string | null;
  trainerEditorId?: string | null;
  editable?: boolean;
  onWeekSelect?: (weekStart: Date) => void;
};

const PHASE_I18N_HINT: Record<PeriodPhase, string> = {
  accumulation: "Fase neutra / base",
  transmutation: "Fase verde / intensificação",
  realization: "Fase âmbar / realização",
};

const PHASE_TIMELINE_SURFACE: Record<PeriodPhase, string> = {
  accumulation: "border-white/12 bg-white/[0.045]",
  transmutation: "border-primary/24 bg-primary/10",
  realization: "border-[#f6c278]/20 bg-[#f6c278]/10",
};

const PHASE_TIMELINE_GLOW: Record<PeriodPhase, string> = {
  accumulation: "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  transmutation: "shadow-[0_18px_36px_rgba(30,215,96,0.12)]",
  realization: "shadow-[0_18px_36px_rgba(246,194,120,0.12)]",
};

const PHASE_TIMELINE_TEXT: Record<PeriodPhase, string> = {
  accumulation: "text-white/78",
  transmutation: "text-primary",
  realization: "text-[#f6c278]",
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
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [legendEditorOpen, setLegendEditorOpen] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);
  const [savingBulkAction, setSavingBulkAction] = useState(false);

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
  const { upsertManyPhases, clearManyWeeks } = scoped;

  const role = editable && scope ? "coach" : "student";
  const canEdit = role === "coach";
  const currentWeekIso = useMemo(() => toISODateString(normalizeWeekStartMonday(new Date())), []);

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

  useEffect(() => {
    if (!editable || !trainerEditorId) return;
    setLabelDraft({
      accumulation: phaseLabelOverrides.accumulation ?? "",
      transmutation: phaseLabelOverrides.transmutation ?? "",
      realization: phaseLabelOverrides.realization ?? "",
    });
  }, [phaseLabelOverrides, editable, trainerEditorId]);

  useEffect(() => {
    setSelectedWeeks([]);
  }, [page, role, studentId, groupId]);

  const onSaveLabels = useCallback(async () => {
    if (!trainerEditorId) return;
    setSavingLabels(true);
    try {
      await savePhaseLabels(trainerEditorId, {
        accumulation: labelDraft.accumulation,
        transmutation: labelDraft.transmutation,
        realization: labelDraft.realization,
      });
      toast.success("Legenda atualizada");
      setLegendEditorOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao guardar legenda";
      toast.error(message);
    } finally {
      setSavingLabels(false);
    }
  }, [labelDraft, savePhaseLabels, trainerEditorId]);

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
      toast.success("Legenda voltou ao padrão FitBlock");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao repor legenda";
      toast.error(message);
    } finally {
      setSavingLabels(false);
    }
  }, [refetchPhaseLabels, trainerEditorId]);

  const phaseByWeek = useMemo(() => {
    const map = new Map<string, PeriodPhase>();
    for (const row of rows) {
      if (PERIOD_PHASES.includes(row.phase as PeriodPhase)) {
        map.set(row.week_start, row.phase as PeriodPhase);
      }
    }
    return map;
  }, [rows]);

  const selectedWeekSet = useMemo(() => new Set(selectedWeeks), [selectedWeeks]);
  const hasAnyPhase = phaseByWeek.size > 0;
  const currentPhase = phaseByWeek.get(currentWeekIso);
  const rangeLabel = `${format(firstMonday, "dd MMM", { locale: ptBR })} - ${format(
    weekDates[weekDates.length - 1] ?? firstMonday,
    "dd MMM yyyy",
    { locale: ptBR },
  )}`;
  const selectedWeeksLabel =
    selectedWeeks.length === 1 ? "1 semana selecionada" : `${selectedWeeks.length} semanas selecionadas`;

  const toggleWeekSelection = useCallback((iso: string) => {
    setSelectedWeeks((previous) =>
      previous.includes(iso) ? previous.filter((value) => value !== iso) : [...previous, iso],
    );
  }, []);

  const handleBulkPhaseApply = useCallback(
    async (phase: PeriodPhase) => {
      if (!canEdit || selectedWeeks.length === 0) return;
      setSavingBulkAction(true);
      try {
        await upsertManyPhases(selectedWeeks, phase);
        toast.success(
          selectedWeeks.length === 1
            ? "Fase aplicada à semana selecionada"
            : `Fase aplicada a ${selectedWeeks.length} semanas`,
        );
        setSelectedWeeks([]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao aplicar fase";
        toast.error(message);
      } finally {
        setSavingBulkAction(false);
      }
    },
    [canEdit, selectedWeeks, upsertManyPhases],
  );

  const handleBulkClear = useCallback(async () => {
    if (!canEdit || selectedWeeks.length === 0) return;
    setSavingBulkAction(true);
    try {
      await clearManyWeeks(selectedWeeks);
      toast.success(
        selectedWeeks.length === 1
          ? "Semana limpa"
          : `Fases removidas de ${selectedWeeks.length} semanas`,
      );
      setSelectedWeeks([]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao limpar semanas";
      toast.error(message);
    } finally {
      setSavingBulkAction(false);
    }
  }, [canEdit, clearManyWeeks, selectedWeeks]);

  const subtitle = useMemo(() => {
    if (role === "student") return "Leitura rápida do ciclo actual, com destaque da semana em curso.";
    if (groupId) {
      return "Selecione várias semanas e aplique a fase do mesociclo em lote para todo o grupo.";
    }
    return "Selecione várias semanas e aplique a fase do mesociclo em lote para este aluno.";
  }, [groupId, role]);

  return (
    <TrainerPanelCard compact eyebrow="Periodização" title="Linha do mesociclo" subtitle={subtitle}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/80 bg-secondary/40 px-3 py-3 sm:px-4">
          <Button
            type="button"
            variant="icon-circle"
            size="icon"
            onClick={() => setPage((previous) => previous - 1)}
            aria-label="Semanas anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              Janela semanal
            </p>
            <p className="mt-1 truncate text-sm text-foreground">{rangeLabel}</p>
          </div>

          <Button
            type="button"
            variant="icon-circle"
            size="icon"
            onClick={() => setPage((previous) => previous + 1)}
            aria-label="Semanas seguintes"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-secondary/30 px-4 py-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {PERIOD_PHASES.map((phase) => (
                <span
                  key={phase}
                  className={cn(
                    "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground",
                    PHASE_CELL_CLASSES[phase],
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PHASE_LEGEND_SWATCH[phase])} aria-hidden />
                  <span className="truncate">{resolvePhaseLabel(phase, phaseLabelOverrides)}</span>
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {role === "coach"
                ? "Toque nas semanas para montar uma seleção e aplicar a fase de uma vez."
                : currentPhase
                  ? `Semana atual em ${resolvePhaseLabel(currentPhase, phaseLabelOverrides)}.`
                  : "A semana atual ainda não recebeu uma fase do treinador."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {phaseByWeek.size}/{weekDates.length} semanas com fase
            </span>

            {canEdit && trainerEditorId ? (
              <Drawer open={legendEditorOpen} onOpenChange={setLegendEditorOpen}>
                <DrawerTrigger asChild>
                  <Button type="button" variant="secondary-pill" size="sm">
                    <PencilLine className="h-4 w-4" />
                    Editar legenda
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="border-border bg-card">
                  <DrawerHeader className="px-5 pt-5 text-left">
                    <DrawerTitle className="font-display text-[1.5rem] font-normal tracking-[-0.04em] text-foreground">
                      Nomes da legenda
                    </DrawerTitle>
                    <DrawerDescription>
                      Personalize os nomes exibidos nas fases. Se deixar em branco, o FitBlock usa o padrão.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="space-y-4 px-5 pb-2">
                    {PERIOD_PHASES.map((phase) => (
                      <div key={phase} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-3 w-3 rounded-full", PHASE_LEGEND_SWATCH[phase])} aria-hidden />
                          <Label htmlFor={`phase-label-${phase}`} className="text-xs text-muted-foreground">
                            {PHASE_I18N_HINT[phase]}
                          </Label>
                        </div>
                        <Input
                          id={`phase-label-${phase}`}
                          value={labelDraft[phase]}
                          onChange={(event) =>
                            setLabelDraft((previous) => ({ ...previous, [phase]: event.target.value }))
                          }
                          placeholder={PHASE_LABELS_PT[phase]}
                        />
                      </div>
                    ))}
                  </div>

                  <DrawerFooter className="px-5 pb-6">
                    <Button
                      type="button"
                      variant="primary-pill"
                      onClick={() => void onSaveLabels()}
                      disabled={savingLabels}
                    >
                      {savingLabels ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Guardar nomes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost-pill"
                      onClick={() => void onResetLabels()}
                      disabled={savingLabels}
                    >
                      Repor padrão
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ) : null}
          </div>
        </div>

        {canEdit && selectedWeeks.length > 0 ? (
          <div className="sticky top-3 z-20 rounded-[1.4rem] border border-primary/20 bg-card/95 p-4 shadow-[0_24px_54px_rgba(0,0,0,0.36)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Modo de seleção</p>
                <p className="text-sm text-foreground">{selectedWeeksLabel}</p>
              </div>

              <Button
                type="button"
                variant="ghost-pill"
                size="sm"
                onClick={() => setSelectedWeeks([])}
                disabled={savingBulkAction}
              >
                <X className="h-4 w-4" />
                Limpar seleção
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PERIOD_PHASES.map((phase) => (
                <Button
                  key={phase}
                  type="button"
                  variant="secondary-pill"
                  size="sm"
                  onClick={() => void handleBulkPhaseApply(phase)}
                  disabled={savingBulkAction}
                  className={cn("border-current/10", PHASE_TIMELINE_TEXT[phase])}
                >
                  {savingBulkAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {PHASE_LABELS_COMPACT_PT[phase]}
                </Button>
              ))}

              <Button
                type="button"
                variant="ghost-pill"
                size="sm"
                onClick={() => void handleBulkClear()}
                disabled={savingBulkAction}
              >
                Limpar fase
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[1.25rem] border border-border bg-secondary/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-secondary/20">
              <div className="overflow-x-auto px-4 pb-4 pt-4">
                <div className="grid auto-cols-[minmax(8.9rem,1fr)] grid-flow-col gap-3">
                  {weekDates.map((date, index) => {
                    const iso = toISODateString(date);
                    const phase = phaseByWeek.get(iso);
                    const isSelected = selectedWeekSet.has(iso);
                    const isCurrentWeek = iso === currentWeekIso;
                    const previousDate = index > 0 ? weekDates[index - 1] : null;
                    const startsNewMonth =
                      index === 0 ||
                      !previousDate ||
                      format(previousDate, "yyyy-MM") !== format(date, "yyyy-MM");
                    const resolvedPhaseLabel = phase ? resolvePhaseLabel(phase, phaseLabelOverrides) : "Sem fase";
                    const interactiveStudent = role === "student" && Boolean(onWeekSelect);

                    const tileClasses = cn(
                      "flex min-h-[9.5rem] flex-col rounded-[1.3rem] border px-3.5 py-3 transition-all duration-200",
                      phase ? PHASE_TIMELINE_SURFACE[phase] : "border-border bg-background/70",
                      phase && PHASE_TIMELINE_GLOW[phase],
                      isCurrentWeek && "ring-1 ring-primary/45 ring-offset-2 ring-offset-background",
                      canEdit && "cursor-pointer active:scale-[0.99]",
                      isSelected && "border-primary bg-primary/[0.13] ring-1 ring-primary/50",
                      interactiveStudent && "cursor-pointer hover:border-primary/30",
                    );

                    return (
                      <div key={iso} className="min-w-0 space-y-2">
                        <div className="flex h-6 items-center">
                          {startsNewMonth ? (
                            <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {format(date, "MMM", { locale: ptBR }).replace(".", "")}
                            </span>
                          ) : null}
                        </div>

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => toggleWeekSelection(iso)}
                            aria-pressed={isSelected}
                            className={tileClasses}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 text-left">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  {format(date, "EEE", { locale: ptBR }).replace(".", "")}
                                </p>
                                <p className="font-display text-[2.05rem] leading-none tracking-[-0.06em] text-foreground">
                                  {format(date, "dd")}
                                </p>
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  sem {format(date, "II")}
                                </p>
                              </div>

                              <span
                                className={cn(
                                  "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 font-mono text-[10px] uppercase tracking-[0.16em]",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground",
                                )}
                              >
                                {isSelected ? <Check className="h-3.5 w-3.5" /> : "tap"}
                              </span>
                            </div>

                            <div className="mt-auto space-y-3 text-left">
                              <div className="flex items-center gap-2">
                                {phase ? (
                                  <span
                                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PHASE_LEGEND_SWATCH[phase])}
                                    aria-hidden
                                  />
                                ) : null}
                                <p className="truncate text-sm text-foreground">{resolvedPhaseLabel}</p>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {isSelected ? "Pronta para editar" : "Adicionar à seleção"}
                                </span>
                                {isCurrentWeek ? (
                                  <span className="rounded-full bg-primary/14 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                                    Agora
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        ) : interactiveStudent ? (
                          <button
                            type="button"
                            onClick={() => onWeekSelect?.(date)}
                            aria-label={`Semana de ${format(date, "d 'de' MMM", { locale: ptBR })}: ${resolvedPhaseLabel}`}
                            className={tileClasses}
                          >
                            <div className="flex items-start justify-between gap-3 text-left">
                              <div className="space-y-1">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  {format(date, "EEE", { locale: ptBR }).replace(".", "")}
                                </p>
                                <p className="font-display text-[2rem] leading-none tracking-[-0.06em] text-foreground">
                                  {format(date, "dd")}
                                </p>
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  sem {format(date, "II")}
                                </p>
                              </div>

                              {isCurrentWeek ? (
                                <span className="rounded-full bg-primary/14 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                                  Agora
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-auto space-y-2 text-left">
                              <div className="flex items-center gap-2">
                                {phase ? (
                                  <span
                                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PHASE_LEGEND_SWATCH[phase])}
                                    aria-hidden
                                  />
                                ) : null}
                                <p className="truncate text-sm text-foreground">{resolvedPhaseLabel}</p>
                              </div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                Toque para abrir a semana
                              </p>
                            </div>
                          </button>
                        ) : (
                          <div className={tileClasses}>
                            <div className="flex items-start justify-between gap-3 text-left">
                              <div className="space-y-1">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  {format(date, "EEE", { locale: ptBR }).replace(".", "")}
                                </p>
                                <p className="font-display text-[2rem] leading-none tracking-[-0.06em] text-foreground">
                                  {format(date, "dd")}
                                </p>
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  sem {format(date, "II")}
                                </p>
                              </div>

                              {isCurrentWeek ? (
                                <span className="rounded-full bg-primary/14 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                                  Agora
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-auto flex items-center gap-2 text-left">
                              {phase ? (
                                <span
                                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PHASE_LEGEND_SWATCH[phase])}
                                  aria-hidden
                                />
                              ) : null}
                              <p className="truncate text-sm text-foreground">{resolvedPhaseLabel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {!canEdit && !hasAnyPhase ? (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-secondary/20 px-5 py-6 text-center">
                <p className="text-sm text-foreground">O treinador ainda não definiu fases para esta janela.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assim que o ciclo for configurado, ele vai aparecer aqui na linha do mesociclo.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </TrainerPanelCard>
  );
}
