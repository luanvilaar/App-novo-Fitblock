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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.08] bg-[#121212] px-8 py-24 text-white/30">
        <Dumbbell className="h-12 w-12 animate-pulse text-white/20" />
        <p className="font-mono text-[10px] uppercase tracking-widest">A carregar…</p>
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
