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

  if (loading) return <div className="p-6 max-w-4xl mx-auto space-y-3">{[1,2,3].map(i => <div key={i} className="card-premium p-4 h-16 animate-pulse" />)}</div>;

  return (
    <div className="space-y-10 pb-12 pt-6 page-enter max-w-7xl mx-auto">
      
      {/* ── CLEAN PREMIUM HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-0 z-30 bg-background/80 backdrop-blur-2xl pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => navigate(plannerBack)} 
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-primary font-mono text-[9px] uppercase tracking-[0.3em] font-bold">
              <Pencil className="w-3 h-3" />
              Protocol Designer
            </div>
            <h1 className="font-display text-3xl uppercase tracking-tighter text-white leading-none">
              Editar <span className="text-white/40 italic">Treino</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          {/* iOS STYLE MODE TOGGLE */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
            <button 
              onClick={() => setBuilderMode('form')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                builderMode === 'form' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white/60"
              )}
            >
              Formulário
            </button>
            <button 
              onClick={() => setBuilderMode('smart')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                builderMode === 'smart' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white/60"
              )}
            >
              Inteligente
            </button>
          </div>

          <button 
            onClick={saveWorkout} 
            disabled={saving}
            className="btn-action px-8 h-12 flex items-center justify-center gap-3 whitespace-nowrap shadow-xl"
          >
            {saving ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Salvando..." : "Salvar Protocolo"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/20 uppercase tracking-widest ml-1">Identificação do Protocolo</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="EX: STRENGTH A / METCON SATURDAY" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 text-white text-lg font-display uppercase tracking-tight" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/20 uppercase tracking-widest ml-1">Data de Execução</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 text-white text-lg font-display" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
          {/* Editor Column */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Pencil className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Edição Técnica</h3>
              </div>
              {builderMode === 'smart' ? (
                <div className="flex gap-2">
                  <button
                    onClick={convertSmartToForm}
                    disabled={!smartText.trim() || isConverting}
                    className="h-10 px-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl font-mono text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
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
                  <button onClick={addExercise} className="h-9 px-4 bg-white/5 border border-white/10 hover:border-primary/40 text-white/60 hover:text-primary rounded-lg font-mono text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Exercício
                  </button>
                  <button onClick={addBiSet} className="h-9 px-4 bg-white/5 border border-white/10 hover:border-primary/40 text-white/60 hover:text-primary rounded-lg font-mono text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                    <Link2 className="w-3 h-3" /> Bi-Set
                  </button>
                  <button onClick={addMetcon} className="h-9 px-4 bg-white/5 border border-white/10 hover:border-primary/40 text-white/60 hover:text-primary rounded-lg font-mono text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                    <Layers className="w-3 h-3" /> METCON
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
                    <div className="p-6 border border-border/50 bg-secondary/20 clip-cut-corner-sm text-sm text-muted-foreground">
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
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Visualização do Atleta</h3>
            </div>
            <div className="bg-card/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-2xl min-h-[500px] overflow-y-auto max-h-[800px] custom-scrollbar">
              {builderMode === 'smart' && parsedWorkout ? (
                <SmartWorkoutView workout={parsedWorkout} mode="minimal" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-4">
                  <Activity className="w-12 h-12 text-white/5" />
                  <p className="text-xs font-medium text-white/20 uppercase tracking-widest">Utilize o modo Inteligente para ver a pré-visualização</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showNewExercise} onOpenChange={(open) => { if (!open) { setShowNewExercise(false); setPendingExerciseIdx(null); setNewExerciseName(""); } }}>
        <DialogContent className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <DialogHeader className="space-y-2 mb-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Move Library Update</div>
            <DialogTitle className="font-display text-3xl uppercase tracking-tight text-white">Novo Movimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Identificação do Exercício</Label>
            <Input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="Ex: Bulgarian Split Squat"
              className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary text-white text-lg font-display uppercase tracking-tight"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleNewExercise()}
            />
          </div>
          <DialogFooter className="gap-3 mt-8">
            <button 
              onClick={() => { setShowNewExercise(false); setPendingExerciseIdx(null); setNewExerciseName(""); }}
              className="h-12 px-6 text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleNewExercise} 
              disabled={savingExercise || !newExerciseName.trim()}
              className="btn-action px-8 h-12 flex items-center justify-center font-bold"
            >
              {savingExercise ? <Activity className="w-4 h-4 animate-spin" /> : "Salvar no Catálogo"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium editor (single standard) */}
      <Dialog open={editingIdx !== null} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl max-w-2xl">
          <DialogHeader className="space-y-2 mb-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Element Configuration</div>
            <DialogTitle className="font-display text-3xl uppercase tracking-tight text-white">Ajustar Componente</DialogTitle>
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
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  🔗 BI-SET
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Séries</Label>
                  <Input
                    type="number"
                    value={currentEditingItem.sets || 1}
                    onChange={(e) => updateItemField(editingIdx!, "sets", Number(e.target.value))}
                    className="h-10 bg-secondary/30 border-border clip-cut-corner-sm text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Reps</Label>
                  <Input
                    value={currentEditingItem.reps || ""}
                    onChange={(e) => updateItemField(editingIdx!, "reps", e.target.value)}
                    className="h-10 bg-secondary/30 border-border clip-cut-corner-sm text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Carga</Label>
                  <Input
                    value={currentEditingItem.suggested_load || ""}
                    onChange={(e) => updateItemField(editingIdx!, "suggested_load", e.target.value)}
                    className="h-10 bg-secondary/30 border-border clip-cut-corner-sm text-center"
                    placeholder="kg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                  <Label className="text-[9px] uppercase tracking-widest text-muted-foreground text-center">Série</Label>
                  <Label className="text-[9px] uppercase tracking-widest text-muted-foreground text-center">Reps</Label>
                  <Label className="text-[9px] uppercase tracking-widest text-muted-foreground text-center">Carga</Label>
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
                      className="h-9 bg-secondary/30 border-border clip-cut-corner-sm text-center text-xs"
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
                      className="h-9 bg-secondary/30 border-border clip-cut-corner-sm text-center text-xs"
                      placeholder={currentEditingItem.suggested_load || "kg"}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Observações</Label>                <Textarea
                  value={currentEditingItem.notes || ""}
                  onChange={(e) => updateItemField(editingIdx!, "notes", e.target.value)}
                  placeholder="Observações"
                  className="min-h-[120px] bg-secondary/20 border-border clip-cut-corner-sm"
                />
              </div>
            </div>
          ) : currentEditingItem?.type === "metcon" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Título</Label>
                  <Input
                    value={currentEditingItem.metcon_title || ""}
                    onChange={(e) => updateItemField(editingIdx!, "metcon_title", e.target.value)}
                    className="h-10 bg-secondary/30 border-border clip-cut-corner-sm"
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
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <div className="flex gap-2 flex-wrap">
                  {METCON_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateItemField(editingIdx!, "metcon_type", t)}
                      className={`px-3 py-2 clip-cut-corner-sm text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                        currentEditingItem.metcon_type === t
                          ? "bg-primary text-white border-primary"
                          : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Descrição</Label>
                <Textarea
                  value={currentEditingItem.metcon_description || ""}
                  onChange={(e) => updateItemField(editingIdx!, "metcon_description", e.target.value)}
                  className="min-h-[180px] bg-secondary/20 border-border clip-cut-corner-sm"
                  placeholder={"Descreva o bloco livre...\nEx: For Time:\n500m Corrida\n35 Goblet Squat #32/24kg\n..."}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
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
            <Button variant="hero" onClick={closeEditor}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutDetail;
