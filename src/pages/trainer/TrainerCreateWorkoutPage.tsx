import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Dumbbell } from "lucide-react";
import { TrainerWorkoutBuilderDialog } from "@/components/trainer/TrainerWorkoutBuilderDialog";
import { useTrainerScopedWorkoutMeta, type ScopedMode } from "@/hooks/useTrainerScopedWorkoutMeta";

const TrainerCreateWorkoutPage = ({ mode }: { mode: ScopedMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const {
    id,
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
  } = useTrainerScopedWorkoutMeta(mode);

  const goBack = () => navigate(plannerReturnPath);

  if (loadingMeta) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[28px] border border-border bg-card px-8 py-24 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background text-primary">
          <Dumbbell className="h-7 w-7 animate-pulse" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em]">A carregar criador de treino…</p>
      </div>
    );
  }

  if (!scopeValid || !fixedScope || !id) {
    return null;
  }

  return (
    <div className="pb-4 pt-0">
      <TrainerWorkoutBuilderDialog
        variant="page"
        draftScope={scope}
        fixedScope={fixedScope}
        trainerId={trainerId}
        students={students}
        groups={groups}
        exercises={exercises}
        setExercises={setExercises}
        open
        onOpenChange={() => {}}
        onCreated={() => {}}
        presetDate={dateParam}
        onPageBack={goBack}
        onPageAfterSave={goBack}
      />
    </div>
  );
};

export default TrainerCreateWorkoutPage;
