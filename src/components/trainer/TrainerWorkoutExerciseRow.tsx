import ExerciseCombobox from "@/components/ExerciseCombobox";
import { Input } from "@/components/ui/input";
import { Trash2, Link2, Activity } from "lucide-react";

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
    <div className={`clip-cut-corner-sm p-5 space-y-4 transition-all duration-500 border ${isBiSet ? "bg-primary/5 border-primary/30" : "bg-white/[0.02] border-white/10 hover:border-white/20"}`}>
      
      {/* Header: Movement Selection */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
            <Activity className="w-3 h-3 text-primary" />
            NODE_EXERCISE_IDENTIFIER
          </div>
          <ExerciseCombobox
            exercises={exercises}
            value={ex.exercise_id}
            onChange={(id) => onChange("exercise_id", id)}
            onNewExercise={onNewExercise}
            autoFocus={autoFocus}
            labelWhenEmpty={ex.exercise_id ? undefined : ex.parsed_name}
          />
        </div>
        <div className="flex flex-col gap-2 pt-5">
          {canBiSet && (
            <button
              type="button"
              onClick={onToggleBiSet}
              className={`w-9 h-9 flex items-center justify-center transition-all clip-cut-corner-xs border ${isBiSet ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-primary hover:border-primary/40"}`}
              title="Vincular Bi-Set"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}
          <button 
            type="button" 
            onClick={onRemove} 
            className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:bg-destructive hover:border-destructive hover:text-white transition-all clip-cut-corner-xs"
            title="Remover Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isBiSet && (
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 clip-cut-corner-xs border border-primary/20">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
          LINKED_SEQUENCE // BI-SET_ACTIVE
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
        <div className="space-y-2">
          <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 ml-1">Séries</label>
          <Input
            type="number"
            value={ex.sets}
            onChange={(e) => handleSetCountChange(e.target.value)}
            className="h-10 border-white/10 bg-black/40 focus:border-primary font-mono text-center text-sm rounded-none outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 ml-1">Reps Base</label>
          <Input 
            value={ex.reps} 
            onChange={(e) => onChange("reps", e.target.value)} 
            className="h-10 border-white/10 bg-black/40 focus:border-primary font-mono text-center text-sm rounded-none outline-none" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-0.5 px-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Carga</label>
            <div className="flex bg-white/5 border border-white/10 p-0.5 clip-cut-corner-xs">
              <button
                type="button"
                onClick={() => onChange("load_type", "kg")}
                className={`px-1.5 py-0.5 text-[8px] font-mono font-bold transition-all ${loadType === "kg" ? "bg-primary text-white" : "text-white/20 hover:text-white/60"}`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => onChange("load_type", "percent")}
                className={`px-1.5 py-0.5 text-[8px] font-mono font-bold transition-all ${loadType === "percent" ? "bg-primary text-white" : "text-white/20 hover:text-white/60"}`}
              >
                %
              </button>
            </div>
          </div>
          <Input
            value={ex.suggested_load}
            onChange={(e) => onChange("suggested_load", e.target.value)}
            placeholder={loadType === "percent" ? "60%" : "KG"}
            className="h-10 border-white/10 bg-black/40 focus:border-primary font-mono text-center text-sm rounded-none outline-none"
          />
        </div>
      </div>

      {/* Advanced Telemetry: Set breakdown */}
      <div className="bg-black/40 border border-white/5 p-4 space-y-3">
        <div className="grid grid-cols-[50px_1fr_1fr] gap-4 items-center border-b border-white/5 pb-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20 text-center">ID_SET</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20 text-center">REPS_VAL</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20 text-center">LOAD_REF</span>
        </div>
        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {repsBySet.map((rep, setIdx) => (
            <div key={`${idx}-set-row-${setIdx}`} className="grid grid-cols-[50px_1fr_1fr] gap-4 items-center group/set">
              <span className="font-mono text-[10px] text-white/40 text-center font-bold group-hover/set:text-primary transition-colors">#{String(setIdx + 1).padStart(2, '0')}</span>
              <Input
                value={rep}
                onChange={(e) => updateSetRep(setIdx, e.target.value)}
                placeholder={ex.reps || "REPS"}
                className="h-8 border-white/5 bg-white/[0.02] focus:border-primary font-mono text-center text-[10px] rounded-none transition-all"
              />
              <Input
                value={loadBySet[setIdx]}
                onChange={(e) => updateSetLoad(setIdx, e.target.value)}
                placeholder={ex.suggested_load || (loadType === "percent" ? "%" : "KG")}
                className="h-8 border-white/5 bg-white/[0.02] focus:border-primary font-mono text-center text-[10px] rounded-none transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes / Technical Observations */}
      <div className="space-y-2">
        <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 ml-1">Observações_Briefing</label>
        <textarea
          value={ex.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="INSERIR ESPECIFICAÇÕES TÉCNICAS..."
          rows={2}
          className="w-full min-h-[70px] bg-black/40 border border-white/10 p-3 font-mono text-[10px] uppercase tracking-widest text-white/60 focus:border-primary focus:outline-none transition-all placeholder:text-white/10"
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
