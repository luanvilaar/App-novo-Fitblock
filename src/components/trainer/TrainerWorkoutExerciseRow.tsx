import ExerciseCombobox from "@/components/ExerciseCombobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Activity, Link2, Trash2 } from "lucide-react";

export interface TrainerExerciseRowExercise {
  id: string;
  name: string;
  category: string;
  video_url?: string | null;
}

export const TrainerWorkoutExerciseRow = ({
  ex,
  idx,
  onChange,
  onRemove,
  canBiSet,
  isBiSet,
  onToggleBiSet,
  exercises,
  onNewExercise,
  autoFocus,
}: {
  ex: {
    exercise_id: string;
    parsed_name?: string;
    sets: number;
    reps: string;
    reps_scheme?: string[];
    suggested_load: string;
    load_type?: "kg" | "percent";
    load_scheme?: string[];
    notes: string;
    video_url: string;
  };
  idx: number;
  onChange: (field: string, value: unknown) => void;
  onRemove: () => void;
  canBiSet: boolean;
  isBiSet: boolean;
  onToggleBiSet: () => void;
  exercises: TrainerExerciseRowExercise[];
  onNewExercise: () => void;
  autoFocus?: boolean;
}) => {
  const loadType = ex.load_type || "kg";
  const setsCount = Math.max(1, Number(ex.sets || 1));
  const repsBySet = Array.from({ length: setsCount }, (_, i) => ex.reps_scheme?.[i] ?? ex.reps ?? "");
  const loadBySet = Array.from({ length: setsCount }, (_, i) => ex.load_scheme?.[i] ?? ex.suggested_load ?? "");

  const handleSetCountChange = (value: string) => {
    const nextSets = Math.max(1, Number(value) || 1);
    const nextRepsScheme = Array.from({ length: nextSets }, (_, i) => repsBySet[i] ?? ex.reps ?? "");
    const nextLoadScheme = Array.from({ length: nextSets }, (_, i) => loadBySet[i] ?? ex.suggested_load ?? "");
    onChange("sets", nextSets);
    onChange("reps_scheme", nextRepsScheme);
    onChange("load_scheme", nextLoadScheme);
  };

  const updateSetRep = (setIdx: number, value: string) => {
    const nextRepsScheme = [...repsBySet];
    nextRepsScheme[setIdx] = value;
    onChange("reps_scheme", nextRepsScheme);
  };

  const updateSetLoad = (setIdx: number, value: string) => {
    const nextLoadScheme = [...loadBySet];
    nextLoadScheme[setIdx] = value;
    onChange("load_scheme", nextLoadScheme);
  };

  return (
    <div
      className={cn(
        "space-y-5 rounded-[24px] border bg-card p-5 transition-colors md:p-6",
        isBiSet ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono uppercase tracking-[0.18em]">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Exercício {idx + 1}
            </span>
            {isBiSet ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono uppercase tracking-[0.18em] text-primary">
                <Link2 className="h-3.5 w-3.5" />
                Bi-set ativo
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Movimento</p>
            <ExerciseCombobox
              exercises={exercises}
              value={ex.exercise_id}
              onChange={(id) => onChange("exercise_id", id)}
              onNewExercise={onNewExercise}
              autoFocus={autoFocus}
              labelWhenEmpty={ex.exercise_id ? undefined : ex.parsed_name}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:pt-6">
          {canBiSet ? (
            <button
              type="button"
              onClick={onToggleBiSet}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm transition-colors",
                isBiSet
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-primary",
              )}
              title="Vincular Bi-set"
            >
              <Link2 className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
            title="Remover exercício"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 md:grid-cols-[110px_1fr_1fr]">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Séries</label>
          <Input
            type="number"
            value={ex.sets}
            onChange={(e) => handleSetCountChange(e.target.value)}
            className="h-11 rounded-xl border-border bg-background text-center text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Repetições base</label>
          <Input
            value={ex.reps}
            onChange={(e) => onChange("reps", e.target.value)}
            className="h-11 rounded-xl border-border bg-background text-center text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium text-muted-foreground">Carga</label>
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => onChange("load_type", "kg")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  loadType === "kg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => onChange("load_type", "percent")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  loadType === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                %
              </button>
            </div>
          </div>
          <Input
            value={ex.suggested_load}
            onChange={(e) => onChange("suggested_load", e.target.value)}
            placeholder={loadType === "percent" ? "60%" : "20 kg"}
            className="h-11 rounded-xl border-border bg-background text-center text-sm"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-[20px] border border-border bg-background p-4">
        <div className="grid grid-cols-[56px_1fr_1fr] gap-3 border-b border-border pb-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-center">Série</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Carga</span>
        </div>
        <div className="space-y-2">
          {repsBySet.map((rep, setIdx) => (
            <div key={`${idx}-set-row-${setIdx}`} className="grid grid-cols-[56px_1fr_1fr] gap-3">
              <div className="flex items-center justify-center rounded-xl border border-border bg-card text-xs font-medium text-foreground">
                {setIdx + 1}
              </div>
              <Input
                value={rep}
                onChange={(e) => updateSetRep(setIdx, e.target.value)}
                placeholder={ex.reps || "10"}
                className="h-10 rounded-xl border-border bg-card text-center text-sm"
              />
              <Input
                value={loadBySet[setIdx]}
                onChange={(e) => updateSetLoad(setIdx, e.target.value)}
                placeholder={ex.suggested_load || (loadType === "percent" ? "%" : "kg")}
                className="h-10 rounded-xl border-border bg-card text-center text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Observações</label>
        <Textarea
          value={ex.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Pontos técnicos, pausa, cadência, observações para o atleta."
          rows={3}
          className="min-h-[92px] rounded-[20px] border-border bg-background text-sm"
        />
      </div>
    </div>
  );
};

export const TRAINER_BLOCK_CATEGORIES = [
  "Força",
  "Acessórios e Força",
  "LPO",
  "Endurance",
  "Skill Ginástico",
  "Cond. Ginástico",
  "Metcon",
  "Condicionamento",
];
export const TRAINER_BLOCK_DYNAMICS = ["FOR TIME", "AMRAP", "EMOM", "NOT FOR TIME", "INTERVALADO"];
