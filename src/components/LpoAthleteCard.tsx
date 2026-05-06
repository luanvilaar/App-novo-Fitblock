import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dumbbell } from "lucide-react";
import type { LpoExercise } from "@/components/trainer/LpoBlockForm";

interface LpoAthleteCardProps {
  exercise: LpoExercise;
  index: number;
}

const LpoAthleteCard = ({ exercise: ex, index: eIdx }: LpoAthleteCardProps) => {
  const [prValue, setPrValue] = useState("");

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/20">
          <Dumbbell className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">Exercício {eIdx + 1}</span>
      </div>
      <p className="text-sm font-bold whitespace-pre-wrap">{ex.movement}</p>
      {ex.notes && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{ex.notes}</p>}

      {ex.loadType === "percent" && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2">
          <span className="text-[10px] font-bold text-primary whitespace-nowrap">Seu PR (kg):</span>
          <Input
            type="number"
            value={prValue}
            onChange={(e) => setPrValue(e.target.value)}
            placeholder="100"
            className="h-8 w-24 rounded bg-background border-border text-center text-sm font-bold"
          />
        </div>
      )}

      {/* Series table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="grid grid-cols-3 bg-secondary/60 text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">
          <span>Série</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Carga</span>
        </div>
        {(ex.series ?? []).map((s, sIdx) => {
          const calcLoad =
            ex.loadType === "percent" && prValue && s.load
              ? `${Math.round((Number(prValue) * Number(s.load)) / 100)} kg`
              : ex.loadType === "kg" && s.load
              ? `${s.load} kg`
              : ex.loadType === "percent" && s.load
              ? `${s.load}%`
              : "–";
          return (
            <div key={s.id || `row-${sIdx}`} className="grid grid-cols-3 items-center px-2 py-1.5 border-t border-border/30">
              <span className="text-[11px] font-bold text-muted-foreground">{sIdx + 1}</span>
              <span className="text-xs font-bold text-center">{s.reps || "–"}</span>
              <span className="text-xs font-bold text-center">{calcLoad}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LpoAthleteCard;
