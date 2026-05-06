import { useState } from "react";
import { Dumbbell } from "lucide-react";
import LpoBlockForm, { LpoExercise, createEmptyLpo } from "./LpoBlockForm";

/**
 * Preview-only component — mostra como ficará o formulário LPO
 * dentro do bloco de criação de treino.
 */
const LpoBlockPreview = () => {
  const [exercises, setExercises] = useState<LpoExercise[]>([
    {
      ...createEmptyLpo(),
      movement: "Complex Clean\n1 Power Clean\n1 Clean and Jerk",
      notes: "Usa sua máxima de power clean.",
      series: [
        { id: "s1", reps: "2", load: "55" },
        { id: "s2", reps: "2", load: "65" },
        { id: "s3", reps: "2", load: "70" },
        { id: "s4", reps: "2", load: "75" },
        { id: "s5", reps: "2", load: "80" },
      ],
    },
  ]);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="border border-primary/20 rounded-xl p-4 space-y-4 bg-secondary/30">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-black text-primary uppercase">LPO</span>
          </div>
          <span className="text-[10px] bg-primary/20 text-primary rounded px-2 py-0.5 font-bold">CARGA</span>
        </div>
        <LpoBlockForm exercises={exercises} onChange={setExercises} />
      </div>
    </div>
  );
};

export default LpoBlockPreview;
