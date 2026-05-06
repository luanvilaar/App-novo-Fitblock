import ExerciseCombobox from "@/components/ExerciseCombobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        "relative space-y-8 rounded-[2.5rem] border p-8 transition-all",
        isBiSet 
          ? "border-black bg-black/5 shadow-inner" 
          : "border-black/5 bg-white shadow-sm hover:shadow-xl hover:ring-1 hover:ring-black/5"
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-black px-4 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest text-white">
              <Activity className="h-3.5 w-3.5" strokeWidth={3} />
              Bloco {idx + 1}
            </span>
            {isBiSet && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f3f3] px-4 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest text-black">
                <Link2 className="h-3.5 w-3.5" strokeWidth={3} />
                Bi-set Ativo
              </span>
            )}
          </div>

          <div className="space-y-3">
            <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Movimento</Label>
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

        <div className="flex items-center gap-2 md:pt-10">
          {canBiSet && (
            <button
              type="button"
              onClick={onToggleBiSet}
              className={cn(
                "h-12 w-12 flex items-center justify-center rounded-full border transition-all active:scale-90",
                isBiSet
                  ? "border-black bg-black text-white shadow-lg"
                  : "border-black/5 bg-[#f3f3f3] text-black/40 hover:text-black hover:border-black/10"
              )}
              title="Vincular Bi-set"
            >
              <Link2 className="h-4 w-4" strokeWidth={3} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="h-12 w-12 flex items-center justify-center rounded-full border border-black/5 bg-[#f3f3f3] text-black/40 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-90"
            title="Remover exercício"
          >
            <Trash2 className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 border-t border-black/5 pt-8 md:grid-cols-[140px_1fr_1fr]">
        <div className="space-y-3">
          <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Séries</Label>
          <Input
            type="number"
            value={ex.sets}
            onChange={(e) => handleSetCountChange(e.target.value)}
            className="h-14 rounded-2xl border-black/5 bg-[#f3f3f3] text-center font-black text-lg focus:bg-white focus:ring-0"
          />
        </div>
        <div className="space-y-3">
          <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Reps Padrão</Label>
          <Input
            value={ex.reps}
            onChange={(e) => onChange("reps", e.target.value)}
            className="h-14 rounded-2xl border-black/5 bg-[#f3f3f3] text-center font-black text-lg focus:bg-white focus:ring-0"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Carga</Label>
            <div className="flex h-8 rounded-full bg-[#f3f3f3] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => onChange("load_type", "kg")}
                className={cn(
                  "rounded-full px-3 text-[8px] font-black uppercase tracking-widest transition-all",
                  loadType === "kg" ? "bg-black text-white shadow-md" : "text-black/30 hover:text-black"
                )}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => onChange("load_type", "percent")}
                className={cn(
                  "rounded-full px-3 text-[8px] font-black uppercase tracking-widest transition-all",
                  loadType === "percent" ? "bg-black text-white shadow-md" : "text-black/30 hover:text-black"
                )}
              >
                %
              </button>
            </div>
          </div>
          <Input
            value={ex.suggested_load}
            onChange={(e) => onChange("suggested_load", e.target.value)}
            placeholder={loadType === "percent" ? "60%" : "20kg"}
            className="h-14 rounded-2xl border-black/5 bg-[#f3f3f3] text-center font-black text-lg focus:bg-white focus:ring-0"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-[2rem] border border-black/5 bg-[#f3f3f3]/20 p-6">
        <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b border-black/5 pb-4 font-mono text-[9px] font-black uppercase tracking-widest text-black/30">
          <span className="text-center">Série</span>
          <span className="text-center">Repetições</span>
          <span className="text-center">Peso / %</span>
        </div>
        <div className="space-y-3">
          {repsBySet.map((rep, setIdx) => (
            <div key={`${idx}-set-row-${setIdx}`} className="grid grid-cols-[80px_1fr_1fr] gap-4">
              <div className="flex items-center justify-center rounded-xl bg-black text-[10px] font-black text-white shadow-md">
                {setIdx + 1}
              </div>
              <Input
                value={rep}
                onChange={(e) => updateSetRep(setIdx, e.target.value)}
                placeholder={ex.reps || "10"}
                className="h-12 rounded-xl border-black/5 bg-white text-center font-bold focus:ring-2 focus:ring-black/5"
              />
              <Input
                value={loadBySet[setIdx]}
                onChange={(e) => updateSetLoad(setIdx, e.target.value)}
                placeholder={ex.suggested_load || (loadType === "percent" ? "%" : "kg")}
                className="h-12 rounded-xl border-black/5 bg-white text-center font-bold focus:ring-2 focus:ring-black/5"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Notas Técnicas</Label>
        <Textarea
          value={ex.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Ex: Focar na extensão total do quadril..."
          rows={3}
          className="min-h-[120px] rounded-[1.5rem] border-black/5 bg-[#f3f3f3] p-6 font-medium text-black focus:bg-white focus:ring-0 transition-all"
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
