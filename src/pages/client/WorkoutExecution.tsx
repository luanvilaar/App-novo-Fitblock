import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, Layers, Radar, Target } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import ExerciseAccordionCard from "@/components/ExerciseAccordionCard";
import { parseLpoExercises, hasLpoStructuredMarker } from "@/components/trainer/LpoBlockForm";
import LpoAthleteCard from "@/components/LpoAthleteCard";
import MetconMiniRanking from "@/components/MetconMiniRanking";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SmartWorkoutView from "@/components/client/SmartWorkoutView";
import { parseWorkoutText, ParsedExercise, ParsedWorkout } from "@/lib/workoutParser";
import MinimalExerciseListItem from "@/components/client/MinimalExerciseListItem";
import ExerciseExecutionDetail from "@/components/client/ExerciseExecutionDetail";
import { PremiumSetLog as SmartSetLog } from "@/components/client/ExecutionGridPremium";
import { AnimatePresence } from "framer-motion";
import {
  buildPercentSetPlan,
  extractPercentFromLoadString,
  kgFromPercent,
} from "@/lib/load-percent";

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  reps_scheme?: string[] | null;
  suggested_load: string | null;
  load_type?: string;
  load_scheme?: string[] | null;
  notes: string | null;
  sort_order: number;
  superset_group_id: string | null;
  video_url: string | null;
  exercises: { id: string; name: string; category: string } | null;
}

interface MaxLoad {
  exercise_id: string;
  max_load: number;
  unit: string;
}

interface MetconBlock {
  id: string;
  title: string | null;
  description: string;
  metcon_type: string;
  is_ranking_reference: boolean;
  sort_order: number;
}

interface SetLog {
  set_number: number;
  reps_done: number | null;
  load_used: number | null;
  is_completed: boolean;
  notes?: string;
}

interface PremiumSetLog extends SetLog {}

/** Por linha de workout_exercises: substituição e nota (feedback ao treinador) */
interface LineAdaptation {
  substituteExerciseId: string | null;
  studentNote: string;
}

type ActiveOverlay =
  | null
  | { mode: "line"; lineId: string }
  | { mode: "smart"; name: string };

const emptyLineAdaptation = (): LineAdaptation => ({
  substituteExerciseId: null,
  studentNote: "",
});

const effectiveExerciseId = (
  we: WorkoutExercise,
  adaptations: Record<string, LineAdaptation>
): string => adaptations[we.id]?.substituteExerciseId || we.exercise_id;

const SCORE_PLACEHOLDERS: Record<string, string> = {
  "FOR TIME": "mm:ss",
  "AMRAP": "total de reps (ex: 72)",
  "EMOM": "rounds completos",
  "INTERVALADO": "rounds / tempo (ex: 4+45'')",
};

const calculateLoadFromPercent = (
  suggestedLoad: string | null,
  loadType: string | undefined,
  maxLoad: MaxLoad | undefined
): { displayValue: string; calculatedKg: number | null } => {
  if (!suggestedLoad) return { displayValue: "-", calculatedKg: null };

  if (loadType === "percent") {
    const percent = extractPercentFromLoadString(suggestedLoad);
    if (percent == null) return { displayValue: suggestedLoad, calculatedKg: null };
    if (maxLoad && maxLoad.max_load > 0) {
      const calculatedKg = kgFromPercent(percent, maxLoad.max_load);
      return {
        displayValue: `${percent}% (~${calculatedKg}${maxLoad.unit})`,
        calculatedKg,
      };
    }
    return { displayValue: `${percent}%`, calculatedKg: null };
  }

  return { displayValue: suggestedLoad, calculatedKg: null };
};

const formatRepsPrescription = (exercise: WorkoutExercise) => {
  const scheme = (exercise.reps_scheme || []).map((rep) => rep?.trim()).filter(Boolean);
  if (scheme.length > 0) {
    return scheme.join("/");
  }
  return exercise.reps;
};

const WorkoutExecution = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [metcons, setMetcons] = useState<MetconBlock[]>([]);
  const [metconScores, setMetconScores] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({});
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [rankingRefreshKey, setRankingRefreshKey] = useState(0);
  const [savingScore, setSavingScore] = useState(false);
  const [openCardIdx, setOpenCardIdx] = useState<number | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [lineAdaptations, setLineAdaptations] = useState<Record<string, LineAdaptation>>({});
  const [catalogExercises, setCatalogExercises] = useState<{ id: string; name: string; category: string }[]>([]);

  const saveTimeout = useRef<NodeJS.Timeout>();
  const lineAdaptationsRef = useRef<Record<string, LineAdaptation>>({});
  useEffect(() => {
    lineAdaptationsRef.current = lineAdaptations;
  }, [lineAdaptations]);
  const [loadHistory, setLoadHistory] = useState<Record<string, { date: string; load: number; reps: number }[]>>({});
  const [maxLoads, setMaxLoads] = useState<Record<string, MaxLoad>>({});
  
  // Smart Workout Tracking State
  const [smartLogs, setSmartLogs] = useState<Record<string, SmartSetLog[]>>({});
  const smartWorkoutRef = useRef<ParsedWorkout | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const { data: w } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (w) setWorkout(w);

      const [{ data: exs }, { data: mets }] = await Promise.all([
        supabase
          .from("workout_exercises")
          .select("*, exercises(id, name, category)")
          .eq("workout_id", id)
          .order("sort_order"),
        supabase
          .from("workout_metcons")
          .select("*")
          .eq("workout_id", id)
          .order("sort_order")
      ]);

        if (exs) {
          setExercises(exs as WorkoutExercise[]);
        }

      if (mets) setMetcons(mets as MetconBlock[]);

      const { data: catRows } = await supabase
        .from("exercises")
        .select("id, name, category")
        .order("name");
      if (catRows) setCatalogExercises(catRows);

      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let existingLog: { id: string } | null = null;
      if (studentData) {
        setCurrentStudentId(studentData.id);
        const { data: wl0 } = await supabase
          .from("workout_logs")
          .select("id")
          .eq("student_id", studentData.id)
          .eq("workout_id", id)
          .maybeSingle();
        existingLog = wl0;
        if (wl0) {
          setWorkoutLogId(wl0.id);
        }
      }

      // Carregar scores existentes do usuario para os metcons
      if (studentData && mets && mets.length > 0) {
        const metconIds = mets.map((m: MetconBlock) => m.id);
        const { data: existingScores } = await supabase
          .from("metcon_scores")
          .select("metcon_id, score_value")
          .eq("student_id", studentData.id)
          .in("metcon_id", metconIds);
        
        if (existingScores && existingScores.length > 0) {
          const scoresMap: Record<string, string> = {};
          existingScores.forEach(s => { scoresMap[s.metcon_id] = s.score_value; });
          setMetconScores(scoresMap);
        }
      }

      const emptyByLine = (exList: WorkoutExercise[]) => {
        const o: Record<string, SetLog[]> = {};
        exList.forEach((ex) => {
          o[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
            set_number: i + 1,
            reps_done: null,
            load_used: null,
            is_completed: false,
            notes: "",
          }));
        });
        return o;
      };

      if (exs && exs.length > 0) {
        const exList = exs as WorkoutExercise[];
        if (studentData) {
          const adapMap: Record<string, LineAdaptation> = {};

          if (existingLog) {
            const [eR, aR] = await Promise.all([
              supabase.from("exercise_logs").select("*").eq("workout_log_id", existingLog.id),
              supabase
                .from("workout_exercise_adaptations")
                .select("workout_exercise_id, substitute_exercise_id, student_note")
                .eq("workout_log_id", existingLog.id),
            ]);
            const eLogs = eR.data;
            aR.data?.forEach((r) => {
              adapMap[r.workout_exercise_id] = {
                substituteExerciseId: r.substitute_exercise_id,
                studentNote: r.student_note || "",
              };
            });
            setLineAdaptations(adapMap);
            lineAdaptationsRef.current = adapMap;

            const linesByEx: Record<string, string[]> = {};
            exList.forEach((e) => {
              if (!linesByEx[e.exercise_id]) linesByEx[e.exercise_id] = [];
              linesByEx[e.exercise_id].push(e.id);
            });
            const loaded = emptyByLine(exList);
            const applyToLine = (lineId: string, log: Record<string, unknown> & { set_number: number; exercise_id: string; workout_exercise_id?: string | null }) => {
              if (!loaded[lineId]) return;
              const setIdx = log.set_number - 1;
              const row: SetLog = {
                set_number: log.set_number,
                reps_done: log.reps_done,
                load_used: log.load_used != null ? Number(log.load_used) : null,
                is_completed: !!log.is_completed,
                notes: log.notes || "",
              };
              if (loaded[lineId][setIdx] !== undefined) {
                loaded[lineId][setIdx] = row;
              } else {
                loaded[lineId].push(row);
              }
            };
            eLogs?.forEach((log) => {
              if (log.workout_exercise_id && loaded[log.workout_exercise_id]) {
                applyToLine(log.workout_exercise_id, log);
              } else {
                const first = linesByEx[log.exercise_id]?.[0];
                if (first) applyToLine(first, log);
              }
            });
            Object.keys(loaded).forEach((k) => {
              loaded[k].sort((a, b) => a.set_number - b.set_number);
            });
            setLogs(loaded);
          } else {
            setLineAdaptations({});
            lineAdaptationsRef.current = {};
            setLogs(emptyByLine(exList));
          }

          const subIds = Object.values(adapMap)
            .map((a) => a.substituteExerciseId)
            .filter((x): x is string => !!x);
          const exerciseIds = [...new Set([...exList.map((e) => e.exercise_id), ...subIds])];

          // Buscar cargas máximas do atleta
          const { data: studentMaxLoads } = await supabase
            .from("student_max_loads")
            .select("exercise_id, max_load, unit")
            .eq("student_id", studentData.id)
            .in("exercise_id", exerciseIds);
          
          if (studentMaxLoads && studentMaxLoads.length > 0) {
            const maxLoadsMap: Record<string, MaxLoad> = {};
            studentMaxLoads.forEach((ml) => {
              maxLoadsMap[ml.exercise_id] = {
                exercise_id: ml.exercise_id,
                max_load: Number(ml.max_load),
                unit: ml.unit
              };
            });
            setMaxLoads(maxLoadsMap);
          }
          
          const { data: allStudentLogs } = await supabase
            .from("workout_logs")
            .select("id, completed_at")
            .eq("student_id", studentData.id)
            .neq("workout_id", id)
            .order("completed_at", { ascending: false });

          if (allStudentLogs && allStudentLogs.length > 0) {
            const logIds = allStudentLogs.map(l => l.id).slice(0, 200);
            const logDateMap: Record<string, string> = {};
            allStudentLogs.forEach(l => { logDateMap[l.id] = l.completed_at; });

            const { data: prevExLogs } = await supabase
              .from("exercise_logs")
              .select("exercise_id, workout_log_id, load_used, reps_done")
              .in("exercise_id", exerciseIds)
              .in("workout_log_id", logIds)
              .not("load_used", "is", null);

            if (prevExLogs) {
              const histMap: Record<string, { date: string; load: number; reps: number }[]> = {};
              prevExLogs.forEach(log => {
                if (!histMap[log.exercise_id]) histMap[log.exercise_id] = [];
                histMap[log.exercise_id].push({
                  date: logDateMap[log.workout_log_id] || "",
                  load: Number(log.load_used),
                  reps: log.reps_done || 0,
                });
              });
              Object.keys(histMap).forEach(exId => {
                const byDate: Record<string, { date: string; load: number; reps: number }> = {};
                histMap[exId].forEach(entry => {
                  const dateKey = new Date(entry.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                  if (!byDate[dateKey] || entry.load > byDate[dateKey].load) {
                    byDate[dateKey] = { ...entry, date: dateKey };
                  }
                });
                histMap[exId] = Object.values(byDate).sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                ).slice(0, 5);
              });
              setLoadHistory(histMap);
            }
          }
        } else {
          setLogs(emptyByLine(exList));
        }
      } else {
        setLineAdaptations({});
      }

      if (studentData) {

        const descriptionLooksSmart =
          !!w.description &&
          (w.description.includes("*") ||
            w.description.includes("-") ||
            w.description.includes("<"));
        const hasStructuredExercises = !!(exs && exs.length > 0);

        // Só modo "smart parse" quando não há linhas em workout_exercises (fallback texto puro)
        if (descriptionLooksSmart && !hasStructuredExercises) {
          const parsed = parseWorkoutText(w.description!);
          smartWorkoutRef.current = parsed;
          const initialSmartLogs: Record<string, PremiumSetLog[]> = {};
          
          parsed.blocks.forEach(block => {
            block.exercises.forEach(ex => {
              const numSets = ex.sets ? parseInt(ex.sets, 10) : 1;
              initialSmartLogs[ex.name] = Array.from({ length: numSets }, (_, i) => ({
                set_number: i + 1,
                load_used: ex.load ? Number(String(ex.load).replace(/\D/g, "")) : null,
                reps_done: null,
                notes: "",
                is_completed: false,
              }));
            });
          });

          if (existingLog) {
            const { data: smartELogs } = await supabase
              .from("exercise_logs")
              .select("*, exercises(name)")
              .eq("workout_log_id", existingLog.id);
            
            if (smartELogs) {
              smartELogs.forEach(log => {
                const exName = (log.exercises as any)?.name;
                if (exName && initialSmartLogs[exName]) {
                  const setIdx = log.set_number - 1;
                  if (initialSmartLogs[exName][setIdx]) {
                    initialSmartLogs[exName][setIdx] = {
                      set_number: log.set_number,
                      load_used: log.load_used ? Number(log.load_used) : null,
                      reps_done: log.reps_done ? Number(log.reps_done) : null,
                      notes: log.notes || "",
                      is_completed: true
                    };
                  }
                }
              });
            }
          }
          setSmartLogs(initialSmartLogs);
        } else {
          setSmartLogs({});
          smartWorkoutRef.current = null;
        }
      }
    };
    load();
  }, [id, user]);

  const autoSave = useCallback(
    async (updatedLogs: Record<string, SetLog[]>, updatedSmartLogs?: Record<string, SmartSetLog[]>, totalTime?: number, force = false) => {
      if (!user || !id) return;
      
      const performSave = async () => {
        setSaving(true);
        try {
          const { data: studentData } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!studentData) return;

          let logId = workoutLogId;
          if (!logId) {
            // Usar upsert para evitar erro de constraint se o log já existir no DB mas não no state
            const { data: newLog } = await supabase
              .from("workout_logs")
              .upsert({ 
                student_id: studentData.id, 
                workout_id: id 
              }, { onConflict: 'student_id,workout_id' })
              .select("id")
              .maybeSingle();
            
            if (newLog) {
              logId = newLog.id;
              setWorkoutLogId(newLog.id);
            }
          }
          if (!logId) return;

          if (totalTime !== undefined) {
            await supabase
              .from("workout_logs")
              .update({ total_time_seconds: totalTime } as any)
              .eq("id", logId);
          }

          // Deletar existentes e inserir novos (abordagem simplificada, mas agora persistindo is_completed)
          await supabase.from("exercise_logs").delete().eq("workout_log_id", logId);

          const adapt = lineAdaptationsRef.current;
          const rows = Object.entries(updatedLogs).flatMap(([lineId, sets]) => {
            const we = exercises.find((e) => e.id === lineId);
            if (!we) return [];
            const eff = effectiveExerciseId(we, adapt);
            return sets
              .filter(
                (s) =>
                  s.reps_done !== null ||
                  s.load_used !== null ||
                  s.is_completed ||
                  s.notes?.trim()
              )
              .map((s) => ({
                workout_log_id: logId!,
                exercise_id: eff,
                workout_exercise_id: lineId,
                set_number: s.set_number,
                reps_done: s.reps_done,
                load_used: s.load_used,
                is_completed: s.is_completed,
                notes: s.notes || null,
              }));
          });

          if (rows.length > 0) {
            await supabase.from("exercise_logs").insert(rows);
          }

          for (const we of exercises) {
            const a = adapt[we.id] || emptyLineAdaptation();
            const hasSub = !!a.substituteExerciseId;
            const hasNote = !!a.studentNote?.trim();
            if (hasSub || hasNote) {
              await supabase.from("workout_exercise_adaptations").upsert(
                {
                  workout_log_id: logId!,
                  workout_exercise_id: we.id,
                  substitute_exercise_id: hasSub ? a.substituteExerciseId : null,
                  student_note: hasNote ? a.studentNote.trim() : null,
                  updated_at: new Date().toISOString(),
                } as any,
                { onConflict: "workout_log_id,workout_exercise_id" }
              );
            } else {
              await supabase
                .from("workout_exercise_adaptations")
                .delete()
                .eq("workout_log_id", logId!)
                .eq("workout_exercise_id", we.id);
            }
          }

          const currentSmart = updatedSmartLogs || smartLogs;
          if (Object.keys(currentSmart).length > 0) {
            const { data: catalog } = await supabase.from("exercises").select("id, name");
            if (catalog) {
              const smartRows: any[] = [];
              Object.entries(currentSmart).forEach(([exName, sLogs]) => {
                const catalogEx = catalog.find(c => c.name.toLowerCase() === exName.toLowerCase());
                if (catalogEx) {
                  sLogs
                    .filter(sl => sl.load_used !== null || sl.is_completed || sl.notes?.trim())
                    .forEach(sl => {
                      smartRows.push({
                        workout_log_id: logId!,
                        exercise_id: catalogEx.id,
                        set_number: sl.set_number,
                        load_used: sl.load_used,
                        is_completed: sl.is_completed,
                        notes: sl.notes || null,
                        reps_done: sl.reps_done || null
                      });
                    });
                }
              });

              if (smartRows.length > 0) {
                await supabase.from("exercise_logs").insert(smartRows);
              }
            }
          }
        } catch (e) {
          console.error("Auto-save error:", e);
        } finally {
          setSaving(false);
        }
      };

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      
      if (force) {
        await performSave();
      } else {
        saveTimeout.current = setTimeout(performSave, 800);
      }
    },
    [user, id, workoutLogId, smartLogs, exercises]
  );

  const updateSet = (exerciseId: string, setIdx: number, field: keyof PremiumSetLog, value: any) => {
    setLogs((prev) => {
      const updated = { ...prev };
      updated[exerciseId] = [...(prev[exerciseId] || [])];
      updated[exerciseId][setIdx] = { ...updated[exerciseId][setIdx], [field]: value };
      autoSave(updated);
      return updated;
    });
  };

   const updateSmartSet = async (exerciseName: string, setIdx: number, field: keyof PremiumSetLog, value: any) => {
    setSmartLogs(prev => {
      const updated = { ...prev };
      const exLogs = [...(prev[exerciseName] || [])];
      if (exLogs[setIdx]) {
        exLogs[setIdx] = { ...exLogs[setIdx], [field]: value };
        updated[exerciseName] = exLogs;
      }
      autoSave(logs, updated);
      return updated;
    });
  };

  const toggleSetComplete = (exerciseId: string, setIdx: number) => {
    setLogs((prev) => {
      const updated = { ...prev };
      if (!updated[exerciseId]) return prev;
      const exerciseLogs = [...updated[exerciseId]];
      exerciseLogs[setIdx] = { 
        ...exerciseLogs[setIdx], 
        is_completed: !exerciseLogs[setIdx].is_completed 
      };
      updated[exerciseId] = exerciseLogs;
      autoSave(updated);
      return updated;
    });
  };

  const toggleSmartSetComplete = (exerciseName: string, setIdx: number) => {
    setSmartLogs((prev) => {
      const exLogs = [...(prev[exerciseName] || [])];
      if (!exLogs[setIdx]) return prev;
      exLogs[setIdx] = {
        ...exLogs[setIdx],
        is_completed: !exLogs[setIdx].is_completed,
      };
      const updated = { ...prev, [exerciseName]: exLogs };
      autoSave(logs, updated);
      return updated;
    });
  };

  const patchLineAdaptation = (lineId: string, patch: Partial<LineAdaptation>) => {
    setLineAdaptations((prev) => {
      const base = { ...emptyLineAdaptation(), ...prev[lineId] };
      const next = { ...prev, [lineId]: { ...base, ...patch } };
      lineAdaptationsRef.current = next;
      return next;
    });
    autoSave(logs, undefined, undefined, true);
  };

  const saveMetconScore = async (metconId: string, scoreValue: string) => {
    if (!currentStudentId || !scoreValue?.trim()) return;
    
    setSavingScore(true);
    try {
      const { error } = await supabase
        .from("metcon_scores")
        .upsert({
          metcon_id: metconId,
          student_id: currentStudentId,
          score_value: scoreValue.trim(),
        }, { onConflict: 'metcon_id,student_id' });
      
      if (error) throw error;
      
      toast.success("Score registrado!");
      setRankingRefreshKey(k => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar score");
    } finally {
      setSavingScore(false);
    }
  };

  const completeWorkout = async () => {
    setCompleting(true);
    // Forçar salvamento final síncrono antes de sair
    await autoSave(logs, smartLogs, undefined, true);
    toast.success("Treino concluído com sucesso!");
    setCompleting(false);
    navigate("/dashboard");
  };

  const saveReferenceMaxForExercise = async (exerciseId: string, maxKg: number) => {
    if (!currentStudentId) {
      toast.error("Sessão de atleta não encontrada.");
      return;
    }
    const unit = "kg";
    const { error } = await supabase.from("student_max_loads").upsert(
      {
        student_id: currentStudentId,
        exercise_id: exerciseId,
        max_load: maxKg,
        unit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,exercise_id" }
    );
    if (error) {
      toast.error(error.message || "Não foi possível salvar a referência.");
      return;
    }
    setMaxLoads((prev) => ({
      ...prev,
      [exerciseId]: { exercise_id: exerciseId, max_load: maxKg, unit },
    }));
    toast.success("Referência salva. Metas em kg atualizadas.");
  };

  // Group exercises by superset_group_id
  const groupedItems: { type: "exercise" | "biset" | "metcon"; exercises?: WorkoutExercise[]; metcon?: MetconBlock }[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.superset_group_id) {
      const group = [ex];
      while (i + 1 < exercises.length && exercises[i + 1].superset_group_id === ex.superset_group_id) {
        i++;
        group.push(exercises[i]);
      }
      groupedItems.push({ type: "biset", exercises: group });
    } else {
      groupedItems.push({ type: "exercise", exercises: [ex] });
    }
    i++;
  }
  for (const m of metcons) {
    groupedItems.push({ type: "metcon", metcon: m });
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-black" />
      </div>
    );
  }

  const descriptionLooksSmart =
    !!workout.description &&
    (workout.description.includes("*") ||
      workout.description.includes("-") ||
      workout.description.includes("<"));
  const showSmartWorkoutFallback = descriptionLooksSmart && exercises.length === 0;

  return (
    <div className="min-h-screen bg-white text-black pb-32">
      
      {/* Cabeçalho App Style */}
      <div className="fixed left-0 top-0 z-50 flex h-20 w-full items-center border-b border-black/5 bg-white/90 px-6 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efefef] text-black transition-transform active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Sessão</p>
              <h1 className="truncate font-sans text-lg font-bold text-black">
                {workout.title || "Treino"}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AnimatePresence>
              {saving && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 rounded-full bg-black/5 px-4 py-1.5"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[1.4px]">Saving</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="pt-24 space-y-4">
        {showSmartWorkoutFallback ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#121212] p-6 md:p-8">
             <div className="mb-6 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
                <Radar className="h-3.5 w-3.5" /> Treino por texto
             </div>
            <SmartWorkoutView 
              workout={parseWorkoutText(workout.description!)} 
              trackingLogs={smartLogs}
              onTrackingUpdate={updateSmartSet}
              onExerciseClick={(ex) => setActiveOverlay({ mode: "smart", name: ex })}
            />
          </div>
        ) : null}

        {/* ── Exercise Stack (padrão do site: lista + detalhe) — sempre que há exercícios/metcons na BD ── */}
        <div className="space-y-4">
            {groupedItems.length > 0 && groupedItems.map((group, gIdx) => {
            if (group.type === "metcon" && group.metcon) {
                const m = group.metcon;
                return (
                <motion.div
                    key={`metcon-${m.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.05 }}
                    className="rounded-2xl border border-white/[0.08] bg-[#121212] p-6 shadow-2xl"
                >
                    <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                        <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="font-display text-xs font-bold uppercase tracking-tight text-primary">Bloco metcon</span>
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{m.metcon_type}</p>
                    </div>
                    </div>
                    {m.title && <h3 className="font-display text-base uppercase tracking-tight mb-3">{m.title}</h3>}
                    {(() => {
                      const lpoParsed = parseLpoExercises(m.description);
                      if (lpoParsed && lpoParsed.length > 0) {
                        return (
                          <div className="space-y-4">
                            {lpoParsed.map((ex, i) => (
                              <LpoAthleteCard key={ex.id} exercise={ex} index={i} />
                            ))}
                          </div>
                        );
                      }
                      if (hasLpoStructuredMarker(m.description)) {
                        return (
                          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                            <p className="mb-2 font-body text-sm text-amber-100/90">
                              Não foi possível ler este bloco LPO automaticamente. Atualiza a app ou contacta o
                              treinador se o problema continuar.
                            </p>
                            <p className="whitespace-pre-wrap font-body text-xs leading-relaxed text-muted-foreground">
                              {m.description.replace(/^\[LPO_STRUCTURED\]\s*/i, "").slice(0, 2000)}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 font-body text-sm leading-relaxed text-muted-foreground">
                          {m.description}
                        </div>
                      );
                    })()}

                    {/* Score Input — partilhado no grupo (RLS + ranking abaixo) */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          Registrar resultado
                        </div>
                        <p className="mt-1 font-body text-[11px] leading-snug text-muted-foreground">
                          Visível para todos os atletas do mesmo grupo. O ranking atualiza quando alguém guarda o resultado.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={SCORE_PLACEHOLDERS[m.metcon_type] || "Score"}
                          value={metconScores[m.id] || ""}
                          onChange={(e) => setMetconScores(prev => ({ ...prev, [m.id]: e.target.value }))}
                          className="h-11 flex-1 font-mono text-center border-border bg-background focus:border-primary"
                        />
                        <button
                          onClick={() => saveMetconScore(m.id, metconScores[m.id])}
                          disabled={!metconScores[m.id]?.trim() || savingScore}
                          className="h-11 rounded-xl bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>

                    {/* Mini Ranking */}
                    <MetconMiniRanking
                      metconId={m.id}
                      metconType={m.metcon_type}
                      currentStudentId={currentStudentId}
                      refreshKey={String(rankingRefreshKey)}
                    />
                </motion.div>
                );
            }

            const exList = group.exercises || [];
            return exList.map((exItem, subIdx) => {
              const eff = effectiveExerciseId(exItem, lineAdaptations);
              const loadInfo = calculateLoadFromPercent(
                exItem.suggested_load,
                exItem.load_type,
                maxLoads[eff]
              );
              const repsPrescription = formatRepsPrescription(exItem);
              const prescription = `${exItem.sets}x${repsPrescription}${
                loadInfo.displayValue !== "-" ? ` @ ${loadInfo.displayValue}` : ""
              }`;
              const isCompleted = logs[exItem.id]?.every((s) => s.is_completed) ?? false;
              const subId = lineAdaptations[exItem.id]?.substituteExerciseId;
              const displayName = subId
                ? catalogExercises.find((c) => c.id === subId)?.name || "Exercício"
                : exItem.exercises?.name || "Exercício";
              const displayCat = subId
                ? catalogExercises.find((c) => c.id === subId)?.category || "Geral"
                : exItem.exercises?.category || "Geral";
              const letterBase = String.fromCharCode(65 + gIdx);
              const letter = exList.length > 1 ? `${letterBase}${subIdx + 1}` : letterBase;
              return (
                <MinimalExerciseListItem
                  key={exItem.id}
                  letter={letter}
                  name={displayName}
                  prescription={prescription}
                  category={displayCat}
                  isCompleted={isCompleted}
                  index={gIdx}
                  onClick={() => setActiveOverlay({ mode: "line", lineId: exItem.id })}
                />
              );
            });
            })}
        </div>
      </div>

      {/* ── Drill-down Overlay ── */}
      <AnimatePresence>
        {activeOverlay && (() => {
          if (activeOverlay.mode === "smart") {
            const smartName = activeOverlay.name;
            if (!smartLogs[smartName]) return null;
            const sets = smartLogs[smartName] || [];
            return (
              <ExerciseExecutionDetail
                key="detail-overlay"
                mode="smart"
                exercise={{
                  id: smartName,
                  name: smartName,
                  letter: "S",
                  category: "Smart",
                  prescription: `${sets.length} séries`,
                  notes: undefined,
                  video_url: undefined,
                  suggestedReps: undefined,
                  suggestedRepsBySet: undefined,
                  suggestedLoad: undefined,
                  suggestedLoadBySet: undefined
                }}
                sets={sets}
                onClose={() => setActiveOverlay(null)}
                onUpdateSet={(field, setIdx, value) => {
                  updateSmartSet(smartName, setIdx, field as keyof PremiumSetLog, value);
                }}
                onToggleComplete={(idx) => toggleSmartSetComplete(smartName, idx)}
              />
            );
          }

          const lineId = activeOverlay.lineId;
          const ex = exercises.find((e) => e.id === lineId);
          if (!ex) return null;
          const eff = effectiveExerciseId(ex, lineAdaptations);
          const gIdx = groupedItems.findIndex((g) => g.exercises?.some((e) => e.id === lineId));
          const gr = gIdx >= 0 ? groupedItems[gIdx] : null;
          const subInGroup = gr?.exercises?.findIndex((e) => e.id === lineId) ?? 0;
          const letterBase = gIdx >= 0 ? String.fromCharCode(65 + gIdx) : "—";
          const label =
            (gr?.exercises?.length || 0) > 1 ? `${letterBase}${subInGroup + 1}` : letterBase;
          const sub = lineAdaptations[lineId]?.substituteExerciseId
            ? catalogExercises.find((c) => c.id === lineAdaptations[lineId]!.substituteExerciseId)
            : null;
          const name = sub?.name || ex.exercises?.name || "";
          const category = sub?.category || ex.exercises?.category || "Geral";
          const history = loadHistory[eff]?.[0] ?? null;
          const workingMax =
            loadHistory[eff]?.reduce((max, h) => Math.max(max, h.load), 0) || 0;
          const sets = logs[lineId] || [];
          const suggestedRepsBySet = Array.from(
            { length: ex.sets },
            (_, idx) => ex.reps_scheme?.[idx] || ex.reps || ""
          );
          const suggestedReps = suggestedRepsBySet.join("/");
          const isPercentExec = ex.load_type === "percent";
          const loadPrescriptionMode: "kg" | "percent" = isPercentExec ? "percent" : "kg";
          const referenceMax = maxLoads[eff] ?? null;
          const hasReferenceMax = !!(referenceMax && referenceMax.max_load > 0);
          const refKg = hasReferenceMax ? referenceMax!.max_load : null;
          const percentPlan = buildPercentSetPlan(
            ex.sets,
            ex.suggested_load,
            ex.load_scheme ?? undefined,
            ex.load_type,
            refKg
          );
          const loadInfo = calculateLoadFromPercent(
            ex.suggested_load,
            ex.load_type,
            maxLoads[eff]
          );
          const suggestedLoad = isPercentExec ? null : loadInfo.displayValue;
          const suggestedLoadBySet = isPercentExec
            ? []
            : Array.from({ length: ex.sets }, (_, idx) => {
                const perSetLoad = ex.load_scheme?.[idx] || ex.suggested_load || "";
                return calculateLoadFromPercent(perSetLoad, ex.load_type, maxLoads[eff])
                  .displayValue;
              });
          const notes = ex.notes || "";

          return (
            <ExerciseExecutionDetail
              key="detail-overlay"
              mode="structured"
              exercise={{
                id: lineId,
                name,
                letter: label,
                category,
                prescription: suggestedReps ? `${sets.length}x${suggestedReps}` : `${sets.length} séries`,
                notes,
                video_url: ex.video_url || "",
                suggestedReps,
                suggestedRepsBySet,
                suggestedLoad,
                suggestedLoadBySet
              }}
              originalExerciseName={ex.exercises?.name}
              isSubstituted={!!lineAdaptations[lineId]?.substituteExerciseId}
              studentNote={lineAdaptations[lineId]?.studentNote || ""}
              onStudentNoteChange={(v) => patchLineAdaptation(lineId, { studentNote: v })}
              exerciseCatalog={catalogExercises}
              onSelectSubstitute={(chooseId) => {
                patchLineAdaptation(lineId, { substituteExerciseId: chooseId });
              }}
              sets={sets}
              lastSession={history}
              workingMax={workingMax}
              loadType={ex.load_type}
              referenceMax={
                referenceMax && referenceMax.max_load > 0
                  ? { max_load: referenceMax.max_load, unit: referenceMax.unit }
                  : null
              }
              studentId={currentStudentId}
              loadPrescriptionMode={loadPrescriptionMode}
              percentPlan={percentPlan}
              hasReferenceMax={hasReferenceMax}
              onSaveReferenceMax={
                ex.load_type === "percent" ? (kg) => saveReferenceMaxForExercise(eff, kg) : undefined
              }
              onClose={() => setActiveOverlay(null)}
              onUpdateSet={(field, setIdx, value) => {
                updateSet(lineId, setIdx, field, value);
              }}
              onToggleComplete={(idx) => toggleSetComplete(lineId, idx)}
            />
          );
        })()}
      </AnimatePresence>

      {/* CTA — Solid Black Pill */}
      <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-[80] mx-auto max-w-lg px-6 pb-safe">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto"
        >
          <button
            type="button"
            onClick={completeWorkout}
            disabled={completing}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-black font-sans text-sm font-bold uppercase tracking-wider text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-20"
          >
            {completing ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <span>Concluir treino</span>
                <Check className="h-5 w-5 text-white" strokeWidth={3} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkoutExecution;
