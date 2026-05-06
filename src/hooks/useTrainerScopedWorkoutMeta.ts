import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemoWorkoutScopeGroup, useMemoWorkoutScopeStudent } from "@/hooks/useTrainerWeekWorkouts";
import type { WorkoutScope } from "@/lib/trainer-workout-scope";
import type { TrainerExerciseRowExercise } from "@/components/trainer/TrainerWorkoutExerciseRow";
import { toast } from "sonner";

export interface ScopedStudent {
  id: string;
  name: string;
}

export interface ScopedGroup {
  id: string;
  name: string;
}

export type ScopedMode = "student" | "group";

export function useTrainerScopedWorkoutMeta(mode: ScopedMode) {
  const navigate = useNavigate();
  const { studentId, groupId } = useParams<{ studentId?: string; groupId?: string }>();
  const { user, isAdmin } = useAuth();
  const userId = user?.id;

  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<TrainerExerciseRowExercise[]>([]);
  const [students, setStudents] = useState<ScopedStudent[]>([]);
  const [groups, setGroups] = useState<ScopedGroup[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [scopeValid, setScopeValid] = useState(false);
  const [entityName, setEntityName] = useState("");

  const id = mode === "student" ? studentId : groupId;
  const scopeStudent = useMemoWorkoutScopeStudent(mode === "student" ? studentId : undefined);
  const scopeGroup = useMemoWorkoutScopeGroup(mode === "group" ? groupId : undefined);
  const scope: WorkoutScope = mode === "student" ? scopeStudent : scopeGroup;

  const plannerReturnPath =
    mode === "student" && id
      ? `/trainer/atletas/${id}/treinos`
      : mode === "group" && id
        ? `/trainer/grupos/${id}/treinos`
        : "/trainer/treinos";

  const fixedScope =
    mode === "student" && id && scope.kind === "student"
      ? { kind: "student" as const, studentId: id }
      : mode === "group" && id && scope.kind === "group"
        ? { kind: "group" as const, groupId: id }
        : undefined;

  const initGeneration = useRef(0);

  useEffect(() => {
    setScopeValid(false);
    setLoadingMeta(true);
  }, [id, mode]);

  useEffect(() => {
    if (!id) {
      setLoadingMeta(false);
      return;
    }
    if (!userId) {
      return;
    }
    const gen = ++initGeneration.current;
    const init = async () => {
      let { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", userId).maybeSingle();
      if (gen !== initGeneration.current) return;

      if (!trainer && isAdmin && userId) {
        const { data: newTrainer, error: tErr } = await supabase
          .from("trainers")
          .insert({ user_id: userId })
          .select("id")
          .single();

        if (!tErr && newTrainer) {
          trainer = newTrainer;
        }
      }

      if (!trainer && !isAdmin) {
        setLoadingMeta(false);
        navigate("/trainer", { replace: true });
        return;
      }

      let contextTrainerId = trainer?.id || null;

      let stsQuery = supabase.from("students").select("id, user_id").eq("active", true);
      let grsQuery = supabase.from("groups").select("id, name");

      if (!isAdmin && trainer) {
        stsQuery = stsQuery.eq("trainer_id", trainer.id);
        grsQuery = grsQuery.eq("trainer_id", trainer.id);
      }

      const [{ data: exs }, { data: rawSts }, { data: grs }] = await Promise.all([
        supabase.from("exercises").select("id, name, category, video_url").order("name"),
        stsQuery,
        grsQuery,
      ]);
      if (gen !== initGeneration.current) return;
      if (exs) setExercises(exs);

      let mergedStudents: ScopedStudent[] = [];
      if (rawSts && rawSts.length > 0) {
        const profileUserIds = rawSts.map((s) => s.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", profileUserIds);
        if (gen !== initGeneration.current) return;
        const pMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);
        mergedStudents = rawSts.map((s) => ({ id: s.id, name: pMap.get(s.user_id) || "" }));
        setStudents(mergedStudents);
      } else {
        setStudents([]);
      }
      if (grs) setGroups(grs);

      if (mode === "student") {
        let query = supabase.from("students").select("id, user_id, trainer_id").eq("id", id);

        if (!isAdmin && trainer) {
          query = query.eq("trainer_id", trainer.id);
        }

        let { data: row } = await query.maybeSingle();

        if (gen !== initGeneration.current) return;

        if (!row) {
          let uidQuery = supabase.from("students").select("id, user_id, trainer_id").eq("user_id", id);

          if (!isAdmin && trainer) {
            uidQuery = uidQuery.eq("trainer_id", trainer.id);
          }

          const { data: rowByUid } = await uidQuery.maybeSingle();

          if (gen !== initGeneration.current) return;

          if (rowByUid && rowByUid.id !== id) {
            navigate(`/trainer/atletas/${rowByUid.id}/treinos`, { replace: true });
            return;
          }

          toast.error("Atleta não encontrado ou não vinculado a você.");
          setLoadingMeta(false);
          navigate("/trainer/atletas", { replace: true });
          return;
        }

        if (row.trainer_id) {
          contextTrainerId = row.trainer_id;
        }

        let displayName = mergedStudents.find((s) => s.id === id)?.name?.trim();
        if (!displayName && row.user_id) {
          const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", row.user_id).maybeSingle();
          if (gen !== initGeneration.current) return;
          displayName = prof?.name?.trim();
        }
        setEntityName(displayName || "Atleta");
        setScopeValid(true);
      } else {
        let query = supabase.from("groups").select("id, name, trainer_id").eq("id", id);

        if (!isAdmin && trainer) {
          query = query.eq("trainer_id", trainer.id);
        }

        const { data: grp, error: groupFetchError } = await query.maybeSingle();
        if (groupFetchError) {
          console.error(groupFetchError);
          toast.error("Não foi possível carregar o grupo. Tente novamente.");
          setLoadingMeta(false);
          navigate("/trainer/grupos", { replace: true });
          return;
        }

        if (gen !== initGeneration.current) return;
        if (!grp) {
          toast.error("Grupo não encontrado ou não vinculado a você.");
          setLoadingMeta(false);
          navigate("/trainer/grupos", { replace: true });
          return;
        }

        if (grp.trainer_id) {
          contextTrainerId = grp.trainer_id;
        }

        setEntityName(grp.name);
        setScopeValid(true);
      }

      setTrainerId(contextTrainerId);
      setLoadingMeta(false);
    };
    void init();
  }, [userId, id, mode, navigate, isAdmin]);

  return {
    id,
    studentId,
    groupId,
    scope,
    fixedScope,
    plannerReturnPath,
    trainerId,
    exercises,
    setExercises,
    students,
    groups,
    loadingMeta,
    scopeValid,
    entityName,
  };
}
