import { useCallback, useEffect, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDown, ArrowLeft, ArrowUp, Layers, Link2, Loader2, Plus, Sparkles, Trash2, Users } from "lucide-react";
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

type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
type WorkoutExerciseInsert = Database["public"]["Tables"]["workout_exercises"]["Insert"];
type WorkoutMetconInsert = Database["public"]["Tables"]["workout_metcons"]["Insert"];

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
          .update({ video_url: String(value) })
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

      const exerciseRows: WorkoutExerciseInsert[] = [];
      let sortOrder = 0;
      for (const item of itemsToSave) {
        if (item.type === "exercise") {
          const row: WorkoutExerciseInsert = {
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
            const fallbackRows = exerciseRows.map((r) => stripWorkoutExerciseExtendedFields(r)) as WorkoutExerciseInsert[];
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
          const metconRow: WorkoutMetconInsert = {
            workout_id: workout.id,
            title: composedTitle,
            description: item.metcon_description || "",
            metcon_type: item.metcon_type || "NOT FOR TIME",
            is_ranking_reference: (item.metcon_type || "NOT FOR TIME") !== "NOT FOR TIME",
            sort_order: metconSortOrder++,
          };
          const { error: metconError } = await supabase.from("workout_metcons").insert(metconRow);
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
    const insertPayload: ExerciseInsert = {
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
  const renderSmart = () => (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-sans text-2xl font-black tracking-tighter text-black">Texto Livre.</h3>
          <p className="font-sans text-sm font-medium text-black/40">O FitBlock processa seu texto e converte em blocos estruturados.</p>
        </div>
        <button
          type="button"
          onClick={() => void convertSmartToForm()}
          disabled={!smartText.trim() || isConverting}
          className="h-12 flex items-center gap-2 rounded-full border border-black/5 bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white disabled:opacity-30"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Converter Treino
            </>
          )}
        </button>
      </div>
      
      <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-[#f3f3f3] shadow-inner focus-within:ring-2 focus-within:ring-black/5 transition-all">
        <SmartWorkoutEditor
          initialValue={smartText}
          onChange={(text, parsed) => {
            setSmartText(text);
            setParsedWorkout(parsed);
          }}
        />
      </div>

      <div className="flex items-center gap-3 font-mono text-[9px] font-black uppercase tracking-widest text-black/20">
        <Sparkles className="h-4 w-4" />
        <span>Use o parser para converter rascunhos rápidos em prescrições técnicas</span>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="workout-title" className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">
            Título do Protocolo
          </Label>
          <Input
            id="workout-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Upper Body A"
            className="h-14 rounded-2xl border-black/5 bg-[#f3f3f3] px-6 font-bold text-black focus:bg-white focus:ring-0"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="workout-date" className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">
            Data de Execução
          </Label>
          <Input
            id="workout-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-14 rounded-2xl border-black/5 bg-[#f3f3f3] px-6 font-bold text-black focus:bg-white focus:ring-0"
          />
        </div>
      </div>

      {showAudienceToggle ? (
        <div className="space-y-6 rounded-[2rem] border border-black/5 bg-[#f3f3f3]/30 p-8">
          <div className="space-y-4">
            <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Destinatário</Label>
            <div className="flex h-12 w-fit rounded-full bg-[#f3f3f3] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setIsGroup(false)}
                className={cn(
                  "flex items-center justify-center rounded-full px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                  !isGroup ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                )}
              >
                Atleta
              </button>
              <button
                type="button"
                onClick={() => setIsGroup(true)}
                className={cn(
                  "flex items-center justify-center rounded-full px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                  isGroup ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                )}
              >
                Grupo
              </button>
            </div>
          </div>

          {isGroup ? (
            <div className="space-y-3">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="h-14 w-full rounded-2xl border border-black/5 bg-[#f3f3f3] px-6 font-bold text-black focus:bg-white focus:outline-none"
              >
                <option value="">Selecionar grupo...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <StudentCombobox
                students={students}
                value={selectedStudentId}
                onChange={setSelectedStudentId}
                placeholder="Pesquisar atleta..."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-6 rounded-[2rem] border border-black/5 bg-[#f3f3f3]/30 p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
            {fixedScope?.kind === "student" ? <Users className="h-7 w-7" /> : <Layers className="h-7 w-7" />}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Atribuído a</p>
            <p className="truncate font-sans text-2xl font-black tracking-tighter text-black">
              {fixedScope?.kind === "student"
                ? students.find((s) => s.id === fixedScope.studentId)?.name || "Atleta"
                : groups.find((g) => g.id === fixedScope?.groupId)?.name || "Grupo"}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-10 pt-10 border-t border-black/5">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h4 className="font-sans text-3xl font-black tracking-tighter text-black">Estrutura.</h4>
            <p className="font-sans text-sm font-medium text-black/40">Defina a ordem e os detalhes de cada bloco.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addExercise}
              className="h-12 flex items-center justify-center gap-2 rounded-full bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
            >
              <Plus className="h-4 w-4" strokeWidth={3} /> Exercício
            </button>
            <button
              type="button"
              onClick={addBiSet}
              className="h-12 flex items-center justify-center gap-2 rounded-full bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
            >
              <Link2 className="h-4 w-4" strokeWidth={3} /> Bi-set
            </button>
            <button
              type="button"
              onClick={addMetcon}
              className="h-12 flex items-center justify-center gap-2 rounded-full bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95"
            >
              <Layers className="h-4 w-4" strokeWidth={3} /> Bloco Livre
            </button>
          </div>
        </header>

        <div className="space-y-6">
          {workoutItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-[2rem] border border-dashed border-black/10 bg-[#f3f3f3]/10">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/20">Nenhum bloco adicionado</p>
            </div>
          ) : (
            <div className="space-y-8">
              {workoutItems.map((item, idx) => (
                <div key={idx} className="relative group/node">
                  {idx > 0 && item.type === "exercise" && item.superset_group_id && (
                    <div className="absolute -top-8 left-10 w-1 h-8 bg-black/10 z-0" />
                  )}
                  
                  <div className="relative z-10">
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
                      <div className="rounded-[2.5rem] border border-black/5 bg-[#f3f3f3]/20 p-8 transition-all hover:bg-white hover:shadow-xl hover:ring-1 hover:ring-black/5 group/block">
                        <div className="flex items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Bloco Livre</p>
                              <h5 className="font-sans text-xl font-black tracking-tighter text-black">
                                {item.block_category || "Configurar Tipo"}
                              </h5>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-[#f3f3f3] text-black transition-all hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={3} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-10">
                          <div className="space-y-4">
                            <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Tipo de Trabalho</Label>
                            <div className="flex flex-wrap gap-2">
                              {TRAINER_BLOCK_CATEGORIES.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => updateItemField(idx, "block_category", t)}
                                  className={cn(
                                    "rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                    item.block_category === t ? "bg-black text-white shadow-md" : "bg-[#f3f3f3] text-black/40 hover:text-black"
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          {item.block_category && (
                            <div className="space-y-10 pt-10 border-t border-black/5">
                              <div className="space-y-3">
                                <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Título (opcional)</Label>
                                <Input
                                  value={item.metcon_title || ""}
                                  onChange={(e) => updateItemField(idx, "metcon_title", e.target.value)}
                                  placeholder="Ex: AMRAP Final"
                                  className="h-12 rounded-xl border-black/5 bg-[#f3f3f3] px-6 font-bold text-black focus:bg-white"
                                />
                              </div>

                              {item.block_category === "LPO" ? (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-widest text-black/40">
                                    <ArrowDown className="h-4 w-4" />
                                    Especificação de Cargas
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
                                <div className="space-y-8">
                                  <div className="space-y-4">
                                    <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Métrica de Resultado</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {TRAINER_BLOCK_DYNAMICS.map((t) => (
                                        <button
                                          key={t}
                                          type="button"
                                          onClick={() => updateItemField(idx, "metcon_type", t)}
                                          className={cn(
                                            "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            item.metcon_type === t ? "bg-black text-white" : "bg-[#f3f3f3] text-black/40 hover:text-black"
                                          )}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Instruções do Protocolo</Label>
                                    <Textarea
                                      value={item.metcon_description || ""}
                                      onChange={(e) => updateItemField(idx, "metcon_description", e.target.value)}
                                      placeholder="Descreva a execução detalhada..."
                                      className="min-h-[140px] rounded-[1.5rem] border-black/5 bg-[#f3f3f3] p-6 font-medium text-black focus:bg-white"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const showAudienceToggle = !fixedScope;

  if (isPage) {
    return (
      <div className="space-y-12 pb-32 pt-8 px-safe">
        <header className="flex flex-col gap-10">
          {onPageBack && (
            <button
              type="button"
              onClick={onPageBack}
              className="group h-12 w-fit flex items-center gap-2 rounded-full border border-black/5 bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
              Voltar
            </button>
          )}

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Criador de Protocolo</p>
              <h1 className="font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-7xl">
                Novo Treino.
              </h1>
            </div>

            <div className="flex h-14 rounded-full bg-[#f3f3f3] p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setBuilderMode("form")}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-full px-8 text-[10px] font-black uppercase tracking-widest transition-all",
                  builderMode === "form" ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                )}
              >
                Formulário
              </button>
              <button
                type="button"
                onClick={() => setBuilderMode("smart")}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-full px-8 text-[10px] font-black uppercase tracking-widest transition-all",
                  builderMode === "smart" ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                )}
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Smart
              </button>
            </div>
          </div>
        </header>

        <div className="rounded-[2.5rem] border border-black/5 bg-white p-10 shadow-sm transition-all">
          {builderMode === "form" ? renderForm() : renderSmart()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-white/90 p-6 backdrop-blur-xl md:p-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="hidden min-w-0 flex-1 md:block">
              <p className="truncate font-sans text-lg font-black tracking-tight text-black">
                {title || "Treino sem título"}
              </p>
              <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/20">
                {workoutItems.length} Blocos configurados
              </p>
            </div>
            <button
              onClick={createWorkout}
              disabled={creating || (builderMode === "form" && workoutItems.length === 0)}
              className="h-16 w-full md:w-auto min-w-[240px] rounded-full bg-black text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {creating ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                "Finalizar Protocolo"
              )}
            </button>
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
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[2.5rem] border border-black/5 bg-white p-0 shadow-2xl">
          <header className="border-b border-black/5 p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Criador de Protocolo</p>
                <DialogTitle className="font-sans text-4xl font-black tracking-tighter text-black">
                  Novo Treino.
                </DialogTitle>
              </div>
              <div className="flex h-12 rounded-full bg-[#f3f3f3] p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBuilderMode("form")}
                  className={cn(
                    "flex items-center justify-center rounded-full px-5 text-[9px] font-black uppercase tracking-widest transition-all",
                    builderMode === "form" ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                  )}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderMode("smart")}
                  className={cn(
                    "flex items-center justify-center rounded-full px-5 text-[9px] font-black uppercase tracking-widest transition-all",
                    builderMode === "smart" ? "bg-black text-white shadow-lg" : "text-black/30 hover:text-black"
                  )}
                >
                  Smart
                </button>
              </div>
            </div>
          </header>

          <div className="p-10">
            {builderMode === "form" ? renderForm() : renderSmart()}
          </div>
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

export default TrainerWorkoutBuilderDialog;
