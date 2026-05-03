import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Layers, Save, ArrowUp, ArrowDown, Link2, Trophy, Pencil, Sparkles } from "lucide-react";
import ExerciseCombobox from "@/components/ExerciseCombobox";
import VideoPreview from "@/components/VideoPreview";
import { toast } from "sonner";
import { motion } from "framer-motion";
import LpoBlockForm, { LpoExercise, serializeLpoExercises, parseLpoExercises, createEmptyLpo } from "@/components/trainer/LpoBlockForm";
import SmartWorkoutEditor from "@/components/trainer/SmartWorkoutEditor";
import SmartWorkoutView from "@/components/client/SmartWorkoutView";
import { parseWorkoutText, ParsedWorkout } from "@/lib/workoutParser";
import {
  normalizeAiResponseToLegacyParsed,
  structureMatches,
  serializeSmartTextAfterHybrid,
  extractFitblockAssistantGuidance,
} from "@/lib/ai-workout-hybrid";
import {
  parsedWorkoutToWorkoutItems,
  ensureExerciseIdsResolved,
  type ExerciseItemLike,
} from "@/lib/smart-convert";
import { cn, isWorkoutExerciseSchemaError, stripWorkoutExerciseExtendedFields } from "@/lib/utils";
import { Activity, Eye, BrainCircuit } from "lucide-react";
import MinimalExerciseListItem from "@/components/client/MinimalExerciseListItem";
import type { TrainerWorkoutPlannerLocationState } from "@/lib/trainer-workout-nav";

interface Exercise {
  id: string;
  name: string;
  category: string;
  video_url?: string | null;
}

interface WorkoutItem {
  type: "exercise" | "metcon";
  exercise_id?: string;
  /** Nome do texto inteligente / fallback de exibição quando o catálogo ainda não foi escolhido */
  parsed_name?: string;
  sets?: number;
  reps?: string;
  reps_scheme?: string[];
  suggested_load?: string;
  load_scheme?: string[];
  notes?: string;
  superset_group_id?: string;
  video_url?: string;
  // metcon
  metcon_id?: string;
  metcon_title?: string;
  metcon_description?: string;
  metcon_type?: string;
  is_ranking_reference?: boolean;
  // LPO structured data
  lpo_exercises?: LpoExercise[];
  block_category?: string;
}

const METCON_TYPES = ["FOR TIME", "AMRAP", "EMOM", "CARGA"];

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const plannerBack =
    (location.state as TrainerWorkoutPlannerLocationState | null)?.fromTrainerPlanner ?? "/trainer/treinos";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("funcional");
  const [date, setDate] = useState("");
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [builderMode, setBuilderMode] = useState<'form' | 'smart'>('form');
  const [smartText, setSmartText] = useState("");
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // New exercise modal state
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [savingExercise, setSavingExercise] = useState(false);
  const [pendingExerciseIdx, setPendingExerciseIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [{ data: workout }, { data: exs }, { data: metcons }] = await Promise.all([
        supabase
          .from("workouts")
          .select("*, workout_exercises(*, exercises(*))")
          .eq("id", id)
          .single(),
        supabase.from("exercises").select("id, name, category, video_url").order("name"),
        supabase.from("workout_metcons").select("*").eq("workout_id", id).order("sort_order"),
      ]);
      if (exs) setAllExercises(exs);
      if (!workout) { setLoading(false); return; }

      setTitle(workout.title);
      setCategory(workout.category);
      setDate(workout.date);
      if (workout.description) {
        setSmartText(workout.description);
        setBuilderMode('smart');
      }

      // Build items: exercises sorted by sort_order
      const weList = (workout.workout_exercises || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );

      const items: WorkoutItem[] = weList.map((we: any) => ({
        type: "exercise" as const,
        exercise_id: we.exercise_id,
        parsed_name: we.exercises?.name || "",
        sets: we.sets,
        reps: we.reps,
        reps_scheme: we.reps_scheme || undefined,
        suggested_load: we.suggested_load || "",
        load_scheme: (we as any).load_scheme || undefined,
        notes: we.notes || "",
        superset_group_id: we.superset_group_id || "",
        video_url: we.video_url || "",
      }));

      // Add metcons
      if (metcons) {
        for (const m of metcons) {
          const lpoExs = parseLpoExercises(m.description || "");
          const isLpo = m.title?.startsWith("LPO") || lpoExs !== null;
          items.push({
            type: "metcon",
            metcon_id: m.id,
            metcon_title: m.title || "",
            metcon_description: m.description || "",
            metcon_type: m.metcon_type || "FOR TIME",
            is_ranking_reference: m.is_ranking_reference || false,
            block_category: isLpo ? "LPO" : undefined,
            lpo_exercises: lpoExs || undefined,
          });
        }
      }

      setWorkoutItems(items);
      setLoading(false);
    };
    load();
  }, [user, id]);

  const addExercise = () => {
    setWorkoutItems((prev) => [
      ...prev,
      { type: "exercise", exercise_id: allExercises[0]?.id || "", parsed_name: "", sets: 3, reps: "10", reps_scheme: ["10", "10", "10"], suggested_load: "", load_scheme: ["", "", ""], notes: "", superset_group_id: "", video_url: allExercises[0]?.video_url || "" },
    ]);
  };

  const addMetcon = () => {
    setWorkoutItems((prev) => {
      const hasRanking = prev.some((i) => i.type === "metcon" && i.is_ranking_reference);
      return [
        ...prev,
        { type: "metcon", metcon_title: "", metcon_description: "", metcon_type: "FOR TIME", is_ranking_reference: !hasRanking },
      ];
    });
  };

  const addBiSet = () => {
    const groupId = crypto.randomUUID().slice(0, 8);
    const defaultExId = allExercises[0]?.id || "";
    const defaultVideo = allExercises[0]?.video_url || "";
    setWorkoutItems((prev) => [
      ...prev,
      { type: "exercise", exercise_id: defaultExId, parsed_name: "", sets: 3, reps: "10", reps_scheme: ["10", "10", "10"], suggested_load: "", load_scheme: ["", "", ""], notes: "", superset_group_id: groupId, video_url: defaultVideo },
      { type: "exercise", exercise_id: defaultExId, parsed_name: "", sets: 3, reps: "10", reps_scheme: ["10", "10", "10"], suggested_load: "", load_scheme: ["", "", ""], notes: "", superset_group_id: groupId, video_url: defaultVideo },
    ]);
  };

  const toggleRankingReference = (idx: number) => {
    setWorkoutItems((prev) => prev.map((item, i) => {
      if (item.type !== "metcon") return item;
      return { ...item, is_ranking_reference: i === idx };
    }));
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

  const updateItemField = (idx: number, field: string, value: any) => {
    setWorkoutItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Auto-populate video_url from exercise library when selecting exercise
      if (field === "exercise_id" && value) {
        const ex = allExercises.find((e) => e.id === value);
        if (ex?.video_url) {
          updated[idx].video_url = ex.video_url;
        }
        if (ex && updated[idx].type === "exercise") {
          updated[idx].parsed_name = ex.name;
        }
      }
      // Save video_url globally to exercises table
      if (field === "video_url" && value && updated[idx].exercise_id) {
        supabase.from("exercises").update({ video_url: value } as any).eq("id", updated[idx].exercise_id!).then(() => {
          setAllExercises((prev) => prev.map((e) => e.id === updated[idx].exercise_id ? { ...e, video_url: value } : e));
        });
      }
      if (field === "sets" && updated[idx].type === "exercise") {
        const nextSets = Math.max(1, Number(value) || 1);
        const baseRep = updated[idx].reps || "";
        const currentScheme = updated[idx].reps_scheme || [];
        updated[idx].reps_scheme = Array.from({ length: nextSets }, (_, setIdx) => currentScheme[setIdx] ?? baseRep);
        const baseLoad = updated[idx].suggested_load || "";
        const currentLoadScheme = updated[idx].load_scheme || [];
        updated[idx].load_scheme = Array.from({ length: nextSets }, (_, setIdx) => currentLoadScheme[setIdx] ?? baseLoad);
      }
      return updated;
    });
  };

  const handleNewExercise = async () => {
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;

    const duplicate = allExercises.find(
      (e) => e.name.toLowerCase().replace(/\s+/g, " ") === trimmed.toLowerCase().replace(/\s+/g, " ")
    );
    if (duplicate) {
      toast.error("Movimento já cadastrado");
      return;
    }

    setSavingExercise(true);
    const { data, error } = await supabase
      .from("exercises")
      .insert({ name: trimmed, category: "geral" })
      .select("id, name, category")
      .single();

    if (error) {
      toast.error(error.message);
      setSavingExercise(false);
      return;
    }

    setAllExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));

    // Auto-select the new exercise if triggered from a row
    if (pendingExerciseIdx !== null) {
      updateItemField(pendingExerciseIdx, "exercise_id", data.id);
    }

    toast.success("Movimento adicionado!");
    setNewExerciseName("");
    setShowNewExercise(false);
    setPendingExerciseIdx(null);
    setSavingExercise(false);
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

  const saveWorkout = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Validate ranking reference
      const metconItems = workoutItems.filter((i) => i.type === "metcon");
      if (metconItems.length > 0 && !metconItems.some((i) => i.is_ranking_reference)) {
        toast.error("Defina um METCON como referência para o ranking antes de salvar.");
        setSaving(false);
        return;
      }

      const description = builderMode === 'smart' ? smartText : null;
      await supabase.from("workouts").update({ title, category, date, description }).eq("id", id);

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
            const { data: exs } = await supabase
              .from("exercises")
              .select("id, name, category, video_url")
              .order("name");
            if (exs) setAllExercises(exs);
          }
        }
      } catch (resolveErr: any) {
        toast.error(resolveErr.message || "Erro ao associar exercícios ao catálogo.");
        setSaving(false);
        return;
      }

      const hasInvalidExercise = itemsToSave.some(
        (i) => i.type === "exercise" && !String(i.exercise_id || "").trim(),
      );
      if (hasInvalidExercise) {
        toast.error("Ainda há linhas sem nome de exercício (conversão). Edite ou apague essas linhas.");
        setSaving(false);
        return;
      }

      // Delete old exercises and reinsert
      await supabase.from("workout_exercises").delete().eq("workout_id", id);
      const exerciseRows: any[] = [];
      let sortOrder = 0;
      for (const item of itemsToSave) {
        if (item.type === "exercise") {
          const row: any = {
            workout_id: id,
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

      // Delete old metcons and reinsert
      await supabase.from("workout_metcons").delete().eq("workout_id", id);
      let metconSort = 0;
      for (const item of itemsToSave) {
        if (item.type === "metcon") {
          await supabase.from("workout_metcons").insert({
            workout_id: id,
            title: item.metcon_title || null,
            description: item.metcon_description || "",
            metcon_type: item.metcon_type || "FOR TIME",
            sort_order: metconSort++,
            is_ranking_reference: item.is_ranking_reference || false,
          });
        }
      }

      toast.success("Treino salvo!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const [isConverting, setIsConverting] = useState(false);

  const convertSmartToForm = async () => {
    if (!smartText.trim()) {
      toast.error("Nada para converter. Escreva um treino no modo Inteligente.");
      return;
    }

    setIsConverting(true);
    const loadingToast = toast.loading("Parser local concluído. IA a refinar observações…");

    try {
      const localParsed = parseWorkoutText(smartText);
      if (!localParsed.blocks.length) {
        toast.error("Não foi possível interpretar o treino com o parser local.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-workout-parser", {
        body: { text: smartText, parsedLocal: localParsed },
      });

      let finalParsed: ParsedWorkout = localParsed;

      if (!error && data) {
        const normalized = normalizeAiResponseToLegacyParsed(data);
        if (normalized && structureMatches(localParsed, normalized)) {
          finalParsed = normalized;
          try {
            setSmartText(serializeSmartTextAfterHybrid(finalParsed));
          } catch {
            /* mantém texto original */
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
          console.warn("IA devolveu estrutura inválida ou diferente; a usar só o parser local.");
          toast.info("Estrutura mantida pelo parser local. IA ignorada ou indisponível.", {
            id: loadingToast,
          });
        }
      } else {
        console.warn("Edge function:", error);
        toast.info("IA indisponível — só o parser local.", { id: loadingToast });
      }

      if (!finalParsed.blocks.length) {
        toast.error("Não foi possível interpretar o treino.");
        return;
      }

      setParsedWorkout(finalParsed);
      const { items, missingCatalogCount } = parsedWorkoutToWorkoutItems(finalParsed, allExercises);
      setWorkoutItems(items as WorkoutItem[]);
      setBuilderMode("form");

      if (missingCatalogCount > 0) {
        toast.warning(
          `Conversão concluída. ${missingCatalogCount} movimento(s) sem match no catálogo.`,
        );
      }
    } catch (err) {
      console.error("Erro na conversão:", err);
      const fallback = parseWorkoutText(smartText);
      const { items } = parsedWorkoutToWorkoutItems(fallback, allExercises);
      setWorkoutItems(items as WorkoutItem[]);
      setBuilderMode("form");
      toast.error("Erro na conexão. Conversão só com parser local.", { id: loadingToast });
    } finally {
      setIsConverting(false);
    }
  };

  const currentEditingItem = editingIdx !== null ? workoutItems[editingIdx] : null;
  const openEditor = (idx: number) => setEditingIdx(idx);
  const closeEditor = () => setEditingIdx(null);

  const getExerciseLetter = (idx: number) => {
    // Letters should be stable for exercises list. Metcons don't consume letters.
    const exerciseIndices = workoutItems
      .map((it, i) => (it.type === "exercise" ? i : -1))
      .filter((i) => i >= 0);
    const pos = exerciseIndices.indexOf(idx);
    return String.fromCharCode(65 + Math.max(0, pos));
  };

  if (loading) return <div className="mx-auto max-w-4xl space-y-3 p-6">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-[24px] border border-border bg-card p-4" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12 pt-6">
      <div className="sticky top-0 z-30 flex flex-col items-start justify-between gap-6 border-b border-border bg-background/95 pb-6 backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => navigate(plannerBack)} 
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              <Pencil className="w-3 h-3" />
              Treino
            </div>
            <h1 className="text-3xl font-medium leading-none tracking-[-0.05em] text-foreground">
              Editar treino
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex w-full rounded-full border border-border bg-card p-1 md:w-auto">
            <button 
              onClick={() => setBuilderMode('form')}
              className={cn(
                "flex-1 rounded-full px-6 py-2 text-sm font-medium transition-colors md:flex-none",
                builderMode === 'form' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
              )}
            >
              Formulário
            </button>
            <button 
              onClick={() => setBuilderMode('smart')}
              className={cn(
                "flex-1 rounded-full px-6 py-2 text-sm font-medium transition-colors md:flex-none",
                builderMode === 'smart' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
              )}
            >
              Texto livre
            </button>
          </div>

          <button 
            onClick={saveWorkout} 
            disabled={saving}
            className="flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Salvando..." : "Salvar treino"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="ml-1 text-xs font-medium text-muted-foreground">Nome do treino</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Força A / sábado" className="h-12 rounded-2xl border-border bg-card text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="ml-1 text-xs font-medium text-muted-foreground">Data de execução</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl border-border bg-card text-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Pencil className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Editor</h3>
              </div>
              {builderMode === 'smart' ? (
                <div className="flex gap-2">
                  <button
                    onClick={convertSmartToForm}
                    disabled={!smartText.trim() || isConverting}
                    className="flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <Sparkles className="w-3 h-3 animate-pulse" /> Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Converter com IA
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={addExercise} className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    <Plus className="w-3 h-3" /> Exercício
                  </button>
                  <button onClick={addBiSet} className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    <Link2 className="w-3 h-3" /> Bi-Set
                  </button>
                  <button onClick={addMetcon} className="flex h-10 items-center gap-2 rounded-full border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                    <Layers className="w-3 h-3" /> Bloco
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 relative">
              {builderMode === 'smart' ? (
                <SmartWorkoutEditor 
                  initialValue={smartText} 
                  onChange={(text, parsed) => {
                    setSmartText(text);
                    setParsedWorkout(parsed);
                  }} 
                />
              ) : (
                <div className="space-y-2">
                  {workoutItems.length === 0 ? (
                    <div className="rounded-[24px] border border-border bg-card p-6 text-sm text-muted-foreground">
                      Nenhum item ainda. Use “Converter” no modo Inteligente ou adicione exercícios.
                    </div>
                  ) : (
                    workoutItems.map((item, idx) => {
                      if (item.type === "exercise") {
                        const ex = allExercises.find(e => e.id === item.exercise_id);
                        const name =
                          ex?.name?.trim() ||
                          item.parsed_name?.trim() ||
                          "Exercício";
                        const letter = getExerciseLetter(idx);
                        const baseRx = `${item.sets || 0}x${item.reps || ""}${item.suggested_load ? ` @ ${item.suggested_load}` : ""}`;
                        const note = item.notes?.trim();
                        const prescription = note
                          ? `${baseRx} · ${note.length > 88 ? `${note.slice(0, 85)}…` : note}`
                          : baseRx;
                        return (
                          <MinimalExerciseListItem
                            key={idx}
                            letter={letter}
                            name={name}
                            prescription={prescription}
                            category={item.block_category || "geral"}
                            index={idx}
                            onClick={() => openEditor(idx)}
                          />
                        );
                      }

                      // metcon
                      const metconName = item.metcon_title?.trim() || "METCON";
                      const metconLetter = "M";
                      const metconPrescription = item.metcon_type || "FOR TIME";
                      return (
                        <MinimalExerciseListItem
                          key={idx}
                          letter={metconLetter}
                          name={metconName}
                          prescription={metconPrescription}
                          category={item.block_category || "CONDICIONAMENTO"}
                          index={idx}
                          onClick={() => openEditor(idx)}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pré-visualização do atleta</h3>
            </div>
            <div className="custom-scrollbar min-h-[500px] max-h-[800px] overflow-y-auto rounded-[28px] border border-border bg-card p-8">
              {builderMode === 'smart' && parsedWorkout ? (
                <SmartWorkoutView workout={parsedWorkout} mode="minimal" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-4 p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Use o modo texto livre para gerar a pré-visualização do atleta.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showNewExercise} onOpenChange={(open) => { if (!open) { setShowNewExercise(false); setPendingExerciseIdx(null); setNewExerciseName(""); } }}>
        <DialogContent className="rounded-[28px] border border-border bg-card p-8">
          <DialogHeader className="mb-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Biblioteca</div>
            <DialogTitle className="text-3xl font-medium tracking-[-0.04em] text-foreground">Novo movimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="ml-1 text-xs font-medium text-muted-foreground">Nome do exercício</Label>
            <Input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="Ex: Bulgarian Split Squat"
              className="h-12 rounded-2xl border-border bg-background text-foreground"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleNewExercise()}
            />
          </div>
          <DialogFooter className="gap-3 mt-8">
            <button 
              onClick={() => { setShowNewExercise(false); setPendingExerciseIdx(null); setNewExerciseName(""); }}
              className="h-12 px-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button 
              onClick={handleNewExercise} 
              disabled={savingExercise || !newExerciseName.trim()}
              className="flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingExercise ? <Activity className="w-4 h-4 animate-spin" /> : "Salvar no Catálogo"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingIdx !== null} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-w-2xl rounded-[28px] border border-border bg-card p-8">
          <DialogHeader className="mb-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Editor</div>
            <DialogTitle className="text-3xl font-medium tracking-[-0.04em] text-foreground">Ajustar item</DialogTitle>
          </DialogHeader>

          {currentEditingItem?.type === "exercise" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <ExerciseCombobox
                    exercises={allExercises}
                    value={currentEditingItem.exercise_id || ""}
                    onChange={(id) => updateItemField(editingIdx!, "exercise_id", id)}
                    onNewExercise={() => {
                      setPendingExerciseIdx(editingIdx);
                      setShowNewExercise(true);
                    }}
                    labelWhenEmpty={
                      currentEditingItem.type === "exercise"
                        ? currentEditingItem.parsed_name
                        : undefined
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(editingIdx!, "up")}
                    disabled={editingIdx === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(editingIdx!, "down")}
                    disabled={editingIdx === workoutItems.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { removeItem(editingIdx!); closeEditor(); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!!currentEditingItem.superset_group_id && (
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
                  Bi-set ativo
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Séries</Label>
                  <Input
                    type="number"
                    value={currentEditingItem.sets || 1}
                    onChange={(e) => updateItemField(editingIdx!, "sets", Number(e.target.value))}
                    className="h-10 rounded-xl border-border bg-background text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Reps</Label>
                  <Input
                    value={currentEditingItem.reps || ""}
                    onChange={(e) => updateItemField(editingIdx!, "reps", e.target.value)}
                    className="h-10 rounded-xl border-border bg-background text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Carga</Label>
                  <Input
                    value={currentEditingItem.suggested_load || ""}
                    onChange={(e) => updateItemField(editingIdx!, "suggested_load", e.target.value)}
                    className="h-10 rounded-xl border-border bg-background text-center"
                    placeholder="kg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                  <Label className="text-center text-[9px] font-medium text-muted-foreground">Série</Label>
                  <Label className="text-center text-[9px] font-medium text-muted-foreground">Reps</Label>
                  <Label className="text-center text-[9px] font-medium text-muted-foreground">Carga</Label>
                </div>
                {Array.from({ length: Math.max(1, Number(currentEditingItem.sets || 1)) }, (_, setIdx) => (
                  <div key={`editing-set-row-${setIdx}`} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                    <span className="text-[10px] text-muted-foreground font-mono text-center font-bold">{setIdx + 1}</span>
                    <Input
                      value={currentEditingItem.reps_scheme?.[setIdx] ?? currentEditingItem.reps ?? ""}
                      onChange={(e) => {
                        const nextScheme = Array.from(
                          { length: Math.max(1, Number(currentEditingItem.sets || 1)) },
                          (_, idx) => currentEditingItem.reps_scheme?.[idx] ?? currentEditingItem.reps ?? ""
                        );
                        nextScheme[setIdx] = e.target.value;
                        updateItemField(editingIdx!, "reps_scheme", nextScheme);
                      }}
                      className="h-9 rounded-xl border-border bg-background text-center text-xs"
                      placeholder={currentEditingItem.reps || "reps"}
                    />
                    <Input
                      value={currentEditingItem.load_scheme?.[setIdx] ?? currentEditingItem.suggested_load ?? ""}
                      onChange={(e) => {
                        const nextScheme = Array.from(
                          { length: Math.max(1, Number(currentEditingItem.sets || 1)) },
                          (_, idx) => currentEditingItem.load_scheme?.[idx] ?? currentEditingItem.suggested_load ?? ""
                        );
                        nextScheme[setIdx] = e.target.value;
                        updateItemField(editingIdx!, "load_scheme", nextScheme);
                      }}
                      className="h-9 rounded-xl border-border bg-background text-center text-xs"
                      placeholder={currentEditingItem.suggested_load || "kg"}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground">Observações</Label>
                <Textarea
                  value={currentEditingItem.notes || ""}
                  onChange={(e) => updateItemField(editingIdx!, "notes", e.target.value)}
                  placeholder="Observações"
                  className="min-h-[120px] rounded-[20px] border-border bg-background"
                />
              </div>
            </div>
          ) : currentEditingItem?.type === "metcon" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Título</Label>
                  <Input
                    value={currentEditingItem.metcon_title || ""}
                    onChange={(e) => updateItemField(editingIdx!, "metcon_title", e.target.value)}
                    className="h-10 rounded-xl border-border bg-background"
                    placeholder="Título do bloco (opcional)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(editingIdx!, "up")}
                    disabled={editingIdx === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(editingIdx!, "down")}
                    disabled={editingIdx === workoutItems.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { removeItem(editingIdx!); closeEditor(); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground">Tipo</Label>
                <div className="flex gap-2 flex-wrap">
                  {METCON_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateItemField(editingIdx!, "metcon_type", t)}
                      className={`rounded-full border px-3 py-2 text-[11px] font-medium transition-colors ${
                        currentEditingItem.metcon_type === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground">Descrição</Label>
                <Textarea
                  value={currentEditingItem.metcon_description || ""}
                  onChange={(e) => updateItemField(editingIdx!, "metcon_description", e.target.value)}
                  className="min-h-[180px] rounded-[20px] border-border bg-background"
                  placeholder={"Descreva o bloco livre...\nEx: For Time:\n500m Corrida\n35 Goblet Squat #32/24kg\n..."}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                  <Trophy className="w-3.5 h-3.5" /> Referência de ranking
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleRankingReference(editingIdx!)}>
                  {currentEditingItem.is_ranking_reference ? "Ativo" : "Definir"}
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEditor}>Fechar</Button>
            <Button className="rounded-full bg-primary text-primary-foreground hover:opacity-90" onClick={closeEditor}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutDetail;
