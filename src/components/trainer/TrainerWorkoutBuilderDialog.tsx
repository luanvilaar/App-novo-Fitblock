import { useCallback, useEffect, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDown, ArrowLeft, ArrowUp, Layers, Link2, Plus, Sparkles, Trash2, Users } from "lucide-react";
import NewExerciseDialog from "@/components/trainer/NewExerciseDialog";
import StudentCombobox from "@/components/StudentCombobox";
import { toast } from "sonner";
import { cn, isWorkoutExerciseSchemaError, stripWorkoutExerciseExtendedFields } from "@/lib/utils";
import { format } from "date-fns";
import LpoBlockForm, { LpoExercise, serializeLpoExercises, createEmptyLpo } from "@/components/trainer/LpoBlockForm";
import SmartWorkoutEditor from "@/components/trainer/SmartWorkoutEditor";
import { ParsedWorkout, parseWorkoutText } from "@/lib/workoutParser";
import {
  normalizeAiResponseToLegacyParsed,
  structureMatches,
  serializeSmartTextAfterHybrid,
  extractFitblockAssistantGuidance,
} from "@/lib/ai-workout-hybrid";
import { parsedWorkoutToWorkoutItems, ensureExerciseIdsResolved, type ExerciseItemLike } from "@/lib/smart-convert";
import type { WorkoutScope } from "@/lib/trainer-workout-scope";
import { workoutDraftStorageKey } from "@/lib/trainer-workout-scope";
import {
  TrainerWorkoutExerciseRow,
  TRAINER_BLOCK_CATEGORIES,
  TRAINER_BLOCK_DYNAMICS,
  type TrainerExerciseRowExercise,
} from "@/components/trainer/TrainerWorkoutExerciseRow";

export interface TrainerWorkoutBuilderStudent {
  id: string;
  name: string;
}

export interface TrainerWorkoutBuilderGroup {
  id: string;
  name: string;
}

export type TrainerFixedWorkoutScope =
  | { kind: "student"; studentId: string }
  | { kind: "group"; groupId: string };

interface WorkoutItem {
  type: "exercise" | "metcon";
  exercise_id?: string;
  parsed_name?: string;
  sets?: number;
  reps?: string;
  reps_scheme?: string[];
  suggested_load?: string;
  load_type?: "kg" | "percent";
  load_scheme?: string[];
  notes?: string;
  superset_group_id?: string;
  video_url?: string;
  metcon_title?: string;
  metcon_description?: string;
  metcon_type?: string;
  block_category?: string;
  lpo_exercises?: LpoExercise[];
}

export function TrainerWorkoutBuilderDialog({
  draftScope,
  fixedScope,
  trainerId,
  students,
  groups,
  exercises,
  setExercises,
  open,
  onOpenChange,
  onCreated,
  presetDate,
  trigger,
  variant = "dialog",
  onPageBack,
  onPageAfterSave,
}: {
  draftScope: WorkoutScope;
  fixedScope?: TrainerFixedWorkoutScope;
  trainerId: string | null;
  students: TrainerWorkoutBuilderStudent[];
  groups: TrainerWorkoutBuilderGroup[];
  exercises: TrainerExerciseRowExercise[];
  setExercises: Dispatch<SetStateAction<TrainerExerciseRowExercise[]>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  /** Ao abrir, pré-preenche a data (ex.: dia selecionado no calendário) */
  presetDate?: string;
  trigger?: ReactNode;
  /** Página em tela cheia em vez de modal (melhor para programar o treino) */
  variant?: "dialog" | "page";
  onPageBack?: () => void;
  /** Após guardar com sucesso na variante `page` */
  onPageAfterSave?: () => void;
}) {
  const isPage = variant === "page";
  /** Página em tela cheia trata-se como sempre aberta para efeitos (rascunho, data pré-preenchida). */
  const effectiveOpen = isPage || open;
  const DRAFT_KEY = workoutDraftStorageKey(draftScope);

  const loadDraft = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw) as Record<string, unknown> | null;
    } catch {
      /* ignore */
    }
    return null;
  }, [DRAFT_KEY]);

  const [title, setTitle] = useState(() => (loadDraft()?.title as string | undefined) ?? "");
  const [category, setCategory] = useState(() => (loadDraft()?.category as string | undefined) ?? "funcional");
  const [date, setDate] = useState(() => (loadDraft()?.date as string | undefined) ?? format(new Date(), "yyyy-MM-dd"));
  const [isGroup, setIsGroup] = useState(() =>
    fixedScope ? fixedScope.kind === "group" : Boolean(loadDraft()?.isGroup ?? false),
  );
  const [selectedGroupId, setSelectedGroupId] = useState(
    () => (fixedScope?.kind === "group" ? fixedScope.groupId : (loadDraft()?.selectedGroupId as string | undefined)) ?? "",
  );
  const [selectedStudentId, setSelectedStudentId] = useState(
    () => (fixedScope?.kind === "student" ? fixedScope.studentId : (loadDraft()?.selectedStudentId as string | undefined)) ?? "",
  );
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>(() => (loadDraft()?.workoutItems as WorkoutItem[] | undefined) ?? []);
  const [creating, setCreating] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [pendingExerciseIdx, setPendingExerciseIdx] = useState<number | null>(null);
  const [builderMode, setBuilderMode] = useState<"form" | "smart">("form");
  const [smartText, setSmartText] = useState("");
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [focusNewItemIdx, setFocusNewItemIdx] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!effectiveOpen) return;
    if (fixedScope?.kind === "student") {
      setIsGroup(false);
      setSelectedStudentId(fixedScope.studentId);
      setSelectedGroupId("");
    } else if (fixedScope?.kind === "group") {
      setIsGroup(true);
      setSelectedGroupId(fixedScope.groupId);
      setSelectedStudentId("");
    }
    if (presetDate) setDate(presetDate);
  }, [effectiveOpen, fixedScope, presetDate]);

  useEffect(() => {
    const hasContent = title || workoutItems.length > 0;
    if (effectiveOpen && hasContent) {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title,
          category,
          date,
          isGroup,
          selectedGroupId,
          selectedStudentId,
          workoutItems,
        }),
      );
    }
  }, [effectiveOpen, title, category, date, isGroup, selectedGroupId, selectedStudentId, workoutItems, DRAFT_KEY]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(DRAFT_KEY);
  }, [DRAFT_KEY]);

  useEffect(() => {
    if (focusNewItemIdx !== null) {
      const timer = setTimeout(() => setFocusNewItemIdx(null), 500);
      return () => clearTimeout(timer);
    }
  }, [focusNewItemIdx]);

  const addExercise = () => {
    setWorkoutItems((prev) => {
      setFocusNewItemIdx(prev.length);
      return [
        ...prev,
        {
          type: "exercise",
          exercise_id: "",
          parsed_name: "",
          sets: 3,
          reps: "10",
          reps_scheme: ["10", "10", "10"],
          suggested_load: "",
          notes: "",
          superset_group_id: "",
          video_url: "",
        },
      ];
    });
  };

  const addMetcon = () => {
    setWorkoutItems((prev) => {
      setFocusNewItemIdx(prev.length);
      return [
        ...prev,
        { type: "metcon", metcon_title: "", metcon_description: "", block_category: "", metcon_type: "NOT FOR TIME" },
      ];
    });
  };

  const addBiSet = () => {
    const groupId = crypto.randomUUID().slice(0, 8);
    setWorkoutItems((prev) => {
      setFocusNewItemIdx(prev.length);
      return [
        ...prev,
        {
          type: "exercise",
          exercise_id: "",
          parsed_name: "",
          sets: 3,
          reps: "10",
          reps_scheme: ["10", "10", "10"],
          suggested_load: "",
          notes: "",
          superset_group_id: groupId,
          video_url: "",
        },
        {
          type: "exercise",
          exercise_id: "",
          parsed_name: "",
          sets: 3,
          reps: "10",
          reps_scheme: ["10", "10", "10"],
          suggested_load: "",
          notes: "",
          superset_group_id: groupId,
          video_url: "",
        },
      ];
    });
  };

  const removeItem = (idx: number) => setWorkoutItems((prev) => prev.filter((_, i) => i !== idx));

  const moveItem = (idx: number, direction: "up" | "down") => {
    setWorkoutItems((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const updateItemField = (idx: number, field: string, value: unknown) => {
    setWorkoutItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value } as WorkoutItem;
      if (field === "exercise_id" && value) {
        const ex = exercises.find((e) => e.id === value);
        if (ex?.video_url) {
          updated[idx].video_url = ex.video_url;
        }
        if (ex && updated[idx].type === "exercise") {
          updated[idx].parsed_name = ex.name;
        }
      }
      if (field === "video_url" && value && updated[idx].exercise_id) {
        supabase
          .from("exercises")
          .update({ video_url: value } as Record<string, unknown>)
          .eq("id", updated[idx].exercise_id!)
          .then(() => {
            setExercises((pex) => pex.map((e) => (e.id === updated[idx].exercise_id ? { ...e, video_url: String(value) } : e)));
          });
      }
      if (field === "block_category" && value === "LPO") {
        updated[idx].metcon_type = "CARGA";
        if (!updated[idx].lpo_exercises?.length) {
          updated[idx].lpo_exercises = [createEmptyLpo()];
        }
      }
      return updated;
    });
  };

  const convertSmartToForm = async () => {
    const localParsed = parsedWorkout || parseWorkoutText(smartText);
    if (!localParsed?.blocks?.length) {
      toast.error("Nada para converter. Escreva um treino no modo texto livre.");
      return;
    }

    setIsConverting(true);
    const loadingToast = toast.loading("Parser local concluído. IA a refinar observações…");

    try {
      let finalParsed: ParsedWorkout = localParsed;

      const { data, error } = await supabase.functions.invoke("ai-workout-parser", {
        body: { text: smartText, parsedLocal: localParsed },
      });

      if (!error && data) {
        const normalized = normalizeAiResponseToLegacyParsed(data);
        if (normalized && structureMatches(localParsed, normalized)) {
          finalParsed = normalized;
          try {
            setSmartText(serializeSmartTextAfterHybrid(finalParsed));
          } catch {
            /* mantém texto */
          }
          const guidance = extractFitblockAssistantGuidance(data);
          const desc =
            [guidance?.summary, ...(guidance?.tips ?? []).slice(0, 2)].filter(Boolean).join(" · ") ||
            undefined;
          toast.success("Observações refinadas (estrutura do parser mantida).", {
            id: loadingToast,
            description: desc,
            duration: desc ? 9000 : 5000,
          });
        } else {
          toast.info("Só parser local — IA ignorada ou indisponível.", { id: loadingToast });
        }
      } else {
        toast.info("IA indisponível — só parser local.", { id: loadingToast });
      }

      const { items, missingCatalogCount } = parsedWorkoutToWorkoutItems(finalParsed, exercises);
      setParsedWorkout(finalParsed);
      setWorkoutItems(items as WorkoutItem[]);
      setBuilderMode("form");
      if (missingCatalogCount > 0) {
        toast.warning(
          `Conversão concluída. ${missingCatalogCount} movimento(s) sem match no catálogo — o nome do texto aparece no seletor até escolher o exercício.`,
        );
      }
    } catch (e) {
      console.error(e);
      const fallback = parsedWorkout || parseWorkoutText(smartText);
      if (!fallback?.blocks?.length) {
        toast.error("Não foi possível converter.");
        return;
      }
      const { items, missingCatalogCount } = parsedWorkoutToWorkoutItems(fallback, exercises);
      setWorkoutItems(items as WorkoutItem[]);
      setBuilderMode("form");
      toast.error("Erro na IA. Conversão só com parser local.", { id: loadingToast });
      if (missingCatalogCount > 0) {
        toast.warning(`${missingCatalogCount} movimento(s) sem match no catálogo.`);
      }
    } finally {
      setIsConverting(false);
    }
  };

  const toggleBiSet = (idx: number) => {
    setWorkoutItems((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      if (item.type !== "exercise" || idx === 0) return prev;
      const prevItem = updated[idx - 1];
      if (prevItem.type !== "exercise") return prev;

      if (item.superset_group_id) {
        updated[idx] = { ...item, superset_group_id: "" };
      } else {
        const groupId = prevItem.superset_group_id || crypto.randomUUID().slice(0, 8);
        updated[idx - 1] = { ...prevItem, superset_group_id: groupId };
        updated[idx] = { ...item, superset_group_id: groupId };
      }
      return updated;
    });
  };

  const createWorkout = async () => {
    if (!trainerId) {
      toast.error("Erro: ID do treinador não encontrado.");
      return;
    }

    let finalTitle = title.trim();
    if (!finalTitle && builderMode === "smart") {
      const firstLine = smartText.split("\n").find((l) => l.trim().length > 0);
      finalTitle = firstLine ? firstLine.replace(/[*#-]/g, "").trim().substring(0, 50) : `Treino ${date}`;
    }

    if (!finalTitle) {
      toast.error("Por favor, informe um título para o treino.");
      return;
    }

    let itemsToSave = workoutItems;
    try {
      const { items: resolved, createdCount, matchedCount } = await ensureExerciseIdsResolved(
        workoutItems as ExerciseItemLike[],
        supabase,
      );
      itemsToSave = resolved as WorkoutItem[];
      if (createdCount > 0 || matchedCount > 0) {
        setWorkoutItems(itemsToSave);
        if (createdCount > 0) {
          toast.success(`${createdCount} exercício(s) criado(s) no catálogo a partir do texto convertido.`);
          const { data: exs } = await supabase.from("exercises").select("id, name, category, video_url").order("name");
          if (exs) setExercises(exs);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao associar exercícios ao catálogo.";
      toast.error(msg);
      return;
    }

    const hasInvalidExercise = itemsToSave.some(
      (item) => item.type === "exercise" && !String(item.exercise_id || "").trim(),
    );
    if (hasInvalidExercise) {
      toast.error("Ainda há linhas sem nome de exercício. Corrija ou remova antes de salvar.");
      return;
    }

    const effectiveIsGroup = fixedScope ? fixedScope.kind === "group" : isGroup;
    const effectiveGroupId = fixedScope?.kind === "group" ? fixedScope.groupId : selectedGroupId;
    const effectiveStudentId = fixedScope?.kind === "student" ? fixedScope.studentId : selectedStudentId;

    if (effectiveIsGroup && !String(effectiveGroupId || "").trim()) {
      toast.error("Selecione um grupo.");
      return;
    }
    if (!effectiveIsGroup && !String(effectiveStudentId || "").trim()) {
      toast.error("Selecione um atleta.");
      return;
    }

    setCreating(true);
    try {
      const { data: workout, error } = await supabase
        .from("workouts")
        .insert({
          trainer_id: trainerId,
          title: finalTitle,
          category,
          date,
          description: builderMode === "smart" ? smartText : null,
          is_group: effectiveIsGroup,
          group_id: effectiveIsGroup ? effectiveGroupId || null : null,
          student_id: !effectiveIsGroup ? effectiveStudentId || null : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const exerciseRows: Record<string, unknown>[] = [];
      let sortOrder = 0;
      for (const item of itemsToSave) {
        if (item.type === "exercise") {
          const row: Record<string, unknown> = {
            workout_id: workout.id,
            exercise_id: String(item.exercise_id).trim(),
            sets: item.sets,
            reps: item.reps,
            suggested_load: item.suggested_load || null,
            notes: item.notes || null,
            block_label: null,
            sort_order: sortOrder++,
            superset_group_id: item.superset_group_id || null,
            video_url: item.video_url || null,
          };
          if (item.reps_scheme?.length) row.reps_scheme = item.reps_scheme;
          if (item.load_type) row.load_type = item.load_type;
          if (item.load_scheme?.length) row.load_scheme = item.load_scheme;
          exerciseRows.push(row);
        }
      }
      if (exerciseRows.length > 0) {
        const { error: exError } = await supabase.from("workout_exercises").insert(exerciseRows);
        if (exError) {
          if (isWorkoutExerciseSchemaError(exError.message)) {
            const fallbackRows = exerciseRows.map((r) => stripWorkoutExerciseExtendedFields(r));
            const { error: fallbackError } = await supabase.from("workout_exercises").insert(fallbackRows);
            if (fallbackError) throw fallbackError;
          } else {
            throw exError;
          }
        }
      }

      let metconSortOrder = 0;
      for (const item of itemsToSave) {
        if (item.type === "metcon" && item.block_category) {
          const composedTitle = `${item.block_category}${item.metcon_title ? ` - ${item.metcon_title}` : ""}`;
          const { error: metconError } = await supabase.from("workout_metcons").insert({
            workout_id: workout.id,
            title: composedTitle,
            description: item.metcon_description || "",
            metcon_type: item.metcon_type || "NOT FOR TIME",
            is_ranking_reference: (item.metcon_type || "NOT FOR TIME") !== "NOT FOR TIME",
            sort_order: metconSortOrder++,
          });
          if (metconError) throw metconError;
        }
      }

      toast.success("Treino criado!");
      clearDraft();
      setTitle("");
      setCategory("funcional");
      setDate(format(new Date(), "yyyy-MM-dd"));
      if (!fixedScope) {
        setIsGroup(false);
        setSelectedGroupId("");
        setSelectedStudentId("");
      } else if (fixedScope.kind === "student") {
        setSelectedStudentId(fixedScope.studentId);
        setSelectedGroupId("");
        setIsGroup(false);
      } else {
        setSelectedGroupId(fixedScope.groupId);
        setSelectedStudentId("");
        setIsGroup(true);
      }
      setWorkoutItems([]);
      setSmartText("");
      setParsedWorkout(null);
      onCreated();
      if (isPage && onPageAfterSave) {
        onPageAfterSave();
      } else {
        onOpenChange(false);
      }
    } catch (e: unknown) {
      console.error("Erro ao salvar treino:", e);
      const msg = e instanceof Error ? e.message : "Erro ao salvar treino";
      toast.error(msg);
    }
    setCreating(false);
  };

  const handleNewExercise = async (data: {
    name: string;
    category: string;
    video_url: string;
    param1_type: string;
    param2_type: string;
    param3_type: string;
  }) => {
    const trimmed = data.name.trim();
    if (!trimmed) return;
    const duplicate = exercises.find(
      (e) => e.name.toLowerCase().replace(/\s+/g, " ") === trimmed.toLowerCase().replace(/\s+/g, " "),
    );
    if (duplicate) {
      toast.error("Movimento já cadastrado");
      return;
    }
    setSavingExercise(true);
    const insertPayload: Record<string, unknown> = {
      name: trimmed,
      category: data.category,
      video_url: data.video_url || null,
      param1_type: data.param1_type || null,
      param2_type: data.param2_type || null,
      param3_type: data.param3_type || null,
    };
    const { data: newEx, error } = await supabase.from("exercises").insert(insertPayload).select("id, name, category, video_url").single();
    if (error) {
      toast.error(error.message);
      setSavingExercise(false);
      return;
    }
    setExercises((prev) => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
    if (pendingExerciseIdx !== null) {
      updateItemField(pendingExerciseIdx, "exercise_id", newEx.id);
      if (newEx.video_url) {
        updateItemField(pendingExerciseIdx, "video_url", newEx.video_url);
      }
    }
    toast.success("Movimento adicionado!");
    setShowNewExercise(false);
    setPendingExerciseIdx(null);
    setSavingExercise(false);
  };

  const showAudienceToggle = !fixedScope;

  const renderForm = () => (
          <div className="space-y-8 p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              <div className="space-y-2">
                <Label htmlFor="workout-title" className="font-body text-xs font-medium text-muted-foreground">
                  Nome do treino
                </Label>
                <Input
                  id="workout-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Upper — empurrar"
                  className="h-12 rounded-2xl border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout-date" className="font-body text-xs font-medium text-muted-foreground">
                  Data
                </Label>
                <Input
                  id="workout-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 rounded-2xl border-border bg-background text-sm text-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {showAudienceToggle ? (
              <div className="space-y-5 rounded-[24px] border border-border bg-card p-5 md:p-6">
                <div className="space-y-3">
                  <Label className="font-body text-xs font-medium text-muted-foreground">Destino</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGroup(false)}
                      className={cn(
                        "h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                        !isGroup
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary",
                      )}
                    >
                      Atleta
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGroup(true)}
                      className={cn(
                        "h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                        isGroup
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary",
                      )}
                    >
                      Grupo
                    </button>
                  </div>
                </div>

                {isGroup ? (
                  <div className="space-y-2">
                    <Label className="font-body text-xs font-medium text-muted-foreground">Grupo</Label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">
                        Selecionar grupo…
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="font-body text-xs font-medium text-muted-foreground">Atleta</Label>
                    <StudentCombobox
                      students={students}
                      value={selectedStudentId}
                      onChange={setSelectedStudentId}
                      placeholder="Procurar atleta…"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-4 md:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary">
                  {fixedScope?.kind === "student" ? <Users className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Destino fixo</p>
                  <p className="truncate text-xl font-medium tracking-[-0.02em] text-foreground md:text-2xl">
                    {fixedScope?.kind === "student"
                      ? students.find((s) => s.id === fixedScope.studentId)?.name || "Atleta"
                      : groups.find((g) => g.id === fixedScope?.groupId)?.name || "Grupo"}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6 border-t border-border pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h4 className="text-2xl font-medium tracking-[-0.03em] text-foreground md:text-[2rem]">Exercícios e blocos</h4>
                  <p className="font-body text-sm text-muted-foreground">Monte a sessão na ordem em que o atleta deve executar.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={addExercise}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> Exercício
                  </button>
                  <button
                    type="button"
                    onClick={addBiSet}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Bi-set
                  </button>
                  <button
                    type="button"
                    onClick={addMetcon}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Layers className="h-3.5 w-3.5" /> Bloco livre
                  </button>
                </div>
              </div>

              <div className={cn("relative space-y-6", isPage && "pl-2 sm:pl-0")}>
                {builderMode === "smart" ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void convertSmartToForm()}
                        disabled={!smartText.trim() || isConverting}
                        className="flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:text-primary disabled:opacity-30"
                      >
                        {isConverting ? (
                          <>
                            <Sparkles className="h-4 w-4 animate-pulse" /> A processar…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" /> Aplicar ao formulário
                          </>
                        )}
                      </button>
                    </div>
                    <SmartWorkoutEditor
                      initialValue={smartText}
                      onChange={(text, parsed) => {
                        setSmartText(text);
                        setParsedWorkout(parsed);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {workoutItems.map((item, idx) => (
                      <div key={idx} className="relative group/node">
                        {idx > 0 && item.type === "exercise" && item.superset_group_id && (
                          <div className="absolute -top-6 left-8 w-px h-6 bg-primary/40 z-10" />
                        )}
                        <div
                          className={cn(
                            "absolute top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity group-hover/node:opacity-40",
                            isPage ? "left-0 sm:-left-12" : "-left-12",
                          )}
                        >
                          <button type="button" onClick={() => moveItem(idx, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-primary disabled:hidden">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => moveItem(idx, "down")} disabled={idx === workoutItems.length - 1} className="text-muted-foreground hover:text-primary disabled:hidden">
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                        {item.type === "exercise" ? (
                          <TrainerWorkoutExerciseRow
                            ex={{
                              exercise_id: item.exercise_id!,
                              parsed_name: item.parsed_name,
                              sets: item.sets!,
                              reps: item.reps!,
                              reps_scheme: item.reps_scheme,
                              suggested_load: item.suggested_load!,
                              load_type: item.load_type,
                              load_scheme: item.load_scheme,
                              notes: item.notes!,
                              video_url: item.video_url || "",
                            }}
                            idx={idx}
                            onChange={(field, value) => updateItemField(idx, field, value)}
                            onRemove={() => removeItem(idx)}
                            canBiSet={idx > 0 && workoutItems[idx - 1]?.type === "exercise"}
                            isBiSet={!!item.superset_group_id}
                            onToggleBiSet={() => toggleBiSet(idx)}
                            exercises={exercises}
                            onNewExercise={() => {
                              setPendingExerciseIdx(idx);
                              setShowNewExercise(true);
                            }}
                            autoFocus={focusNewItemIdx === idx}
                          />
                        ) : (
                          <div className="group/block relative space-y-6 overflow-hidden rounded-[24px] border border-border bg-card p-5 md:p-6">
                            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                  <Layers className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Bloco livre</p>
                                  <p className="truncate text-lg font-medium tracking-[-0.02em] text-foreground">
                                    {item.block_category || "Escolha o tipo"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="font-body text-xs font-medium text-muted-foreground">Tipo de bloco</Label>
                                <div className="flex flex-wrap gap-2">
                                  {TRAINER_BLOCK_CATEGORIES.map((t, catIdx) => (
                                    <button
                                      key={t}
                                      type="button"
                                      autoFocus={focusNewItemIdx === idx && catIdx === 0}
                                      onClick={() => {
                                        updateItemField(idx, "block_category", t);
                                        setFocusNewItemIdx(null);
                                      }}
                                      className={cn(
                                        "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                                        item.block_category === t
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary",
                                      )}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {item.block_category && (
                                <div className="space-y-6 border-t border-border pt-4">
                                  <div className="space-y-2">
                                    <Label className="font-body text-xs font-medium text-muted-foreground">Título (opcional)</Label>
                                    <Input
                                      value={item.metcon_title || ""}
                                      onChange={(e) => updateItemField(idx, "metcon_title", e.target.value)}
                                      placeholder="Nome curto do bloco"
                                      className="h-11 rounded-2xl border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary"
                                    />
                                  </div>

                                  {item.block_category === "LPO" ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2.5">
                                        <span className="font-body text-xs font-medium text-primary">Bloco de cargas (LPO)</span>
                                      </div>
                                      <LpoBlockForm
                                        exercises={item.lpo_exercises || [createEmptyLpo()]}
                                        onChange={(lpoExs) => {
                                          updateItemField(idx, "lpo_exercises", lpoExs);
                                          updateItemField(idx, "metcon_type", "CARGA");
                                          updateItemField(idx, "metcon_description", serializeLpoExercises(lpoExs));
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="space-y-6">
                                      <div className="space-y-2">
                                        <Label className="font-body text-xs font-medium text-muted-foreground">Formato / métrica</Label>
                                        <div className="flex flex-wrap gap-2">
                                          {TRAINER_BLOCK_DYNAMICS.map((t) => (
                                            <button
                                              key={t}
                                              type="button"
                                              onClick={() => updateItemField(idx, "metcon_type", t)}
                                              className={cn(
                                                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                                                item.metcon_type === t
                                                  ? "border-primary bg-primary text-primary-foreground"
                                                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary",
                                              )}
                                            >
                                              {t}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="font-body text-xs font-medium text-muted-foreground">Instruções</Label>
                                        <Textarea
                                          value={item.metcon_description || ""}
                                          onChange={(e) => updateItemField(idx, "metcon_description", e.target.value)}
                                          placeholder="Descreva rounds, tempos, repetições…"
                                          className="min-h-[100px] rounded-[20px] border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

            <div className="flex flex-col items-stretch justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
              <p className="font-body text-xs text-muted-foreground">Revise o nome, a data e a lista antes de guardar.</p>
              <button
                type="button"
                onClick={createWorkout}
                disabled={creating}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {creating ? "A guardar…" : "Guardar treino"}
                {!creating && <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />}
              </button>
            </div>
          </div>
  );

  if (isPage) {
    return (
      <>
        <div className="relative -mx-6 flex min-h-[calc(100dvh-11.5rem)] flex-col sm:min-h-[calc(100dvh-9rem)] md:-mx-16">
          <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-background/95 px-2 pb-5 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 sm:px-4 md:px-0">
            <div className="mx-auto w-full max-w-4xl space-y-4">
              {onPageBack ? (
                <button
                  type="button"
                  onClick={onPageBack}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Voltar</span>
                </button>
              ) : null}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Agendar treino</p>
                  <h1 className="text-3xl font-medium tracking-[-0.04em] text-foreground md:text-4xl">Novo treino</h1>
                  <p className="font-body text-sm text-muted-foreground">
                    Defina o nome, a data e os exercícios. O atleta vê isto como a sessão do dia.
                  </p>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:rounded-full sm:border sm:border-border sm:bg-card sm:p-1">
                  <div className="grid grid-cols-2 gap-2 sm:contents sm:gap-0">
                    <button
                      type="button"
                      onClick={() => setBuilderMode("form")}
                      className={cn(
                        "rounded-full px-4 py-3 text-sm font-medium transition-colors sm:py-2",
                        builderMode === "form"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary sm:border-0 sm:bg-transparent",
                      )}
                    >
                      Formulário
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderMode("smart")}
                      className={cn(
                        "rounded-full px-4 py-3 text-sm font-medium transition-colors sm:py-2",
                        builderMode === "smart"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary sm:border-0 sm:bg-transparent",
                      )}
                    >
                      Texto livre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-8">
            <div className="mx-auto w-full max-w-4xl pt-2">{renderForm()}</div>
          </div>
        </div>
        <NewExerciseDialog
          open={showNewExercise}
          onOpenChange={(o) => {
            if (!o) {
              setShowNewExercise(false);
              setPendingExerciseIdx(null);
            }
          }}
          onSave={handleNewExercise}
          saving={savingExercise}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-[28px] border border-border bg-card p-0">
          <DialogHeader className="border-b border-border p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Agendar treino</p>
                <DialogTitle className="text-3xl font-medium tracking-[-0.04em] text-foreground md:text-4xl">
                  Novo treino
                </DialogTitle>
                <p className="font-body text-sm text-muted-foreground">
                  Defina o nome, a data e os exercícios. O atleta vê isto como a sessão do dia.
                </p>
              </div>
              <div className="flex shrink-0 rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setBuilderMode("form")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    builderMode === "form"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  Formulário
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderMode("smart")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    builderMode === "smart"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  Texto livre
                </button>
              </div>
            </div>
          </DialogHeader>

          {renderForm()}
        </DialogContent>
      </Dialog>

      <NewExerciseDialog
        open={showNewExercise}
        onOpenChange={(o) => {
          if (!o) {
            setShowNewExercise(false);
            setPendingExerciseIdx(null);
          }
        }}
        onSave={handleNewExercise}
        saving={savingExercise}
      />
    </>
  );
}
