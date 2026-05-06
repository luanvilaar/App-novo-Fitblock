import { useState } from "react";
import { ArrowLeft, Check, History, Info, Loader2, MessageSquare, Play, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

import ExecutionGridPremium, { PremiumSetLog } from "./ExecutionGridPremium";
import VideoPreview from "@/components/VideoPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PercentSetPlan } from "@/lib/load-percent";

const formatCategoryLabel = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .split(/[\s_/]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Geral";

interface ExerciseExecutionDetailProps {
  mode?: "structured" | "smart";
  readOnly?: boolean;
  exercise: {
    id: string;
    name: string;
    letter: string;
    category: string;
    prescription: string;
    notes?: string;
    video_url?: string;
    suggestedReps?: string;
    suggestedRepsBySet?: string[];
    suggestedLoad?: string | null;
    suggestedLoadBySet?: string[];
  };
  sets: PremiumSetLog[];
  lastSession?: { load: number; reps: number; date: string } | null;
  workingMax?: number;
  loadType?: string;
  referenceMax?: { max_load: number; unit: string } | null;
  studentId?: string | null;
  loadPrescriptionMode?: "kg" | "percent";
  percentPlan?: PercentSetPlan[];
  hasReferenceMax?: boolean;
  onSaveReferenceMax?: (maxKg: number) => Promise<void>;
  originalExerciseName?: string;
  isSubstituted?: boolean;
  studentNote?: string;
  onStudentNoteChange?: (value: string) => void;
  exerciseCatalog?: { id: string; name: string; category: string }[];
  onSelectSubstitute?: (exerciseId: string | null) => void;
  onClose: () => void;
  onUpdateSet: (field: keyof PremiumSetLog, setIdx: number, value: unknown) => void;
  onToggleComplete: (setIdx: number) => void;
}

const ExerciseExecutionDetail = ({
  readOnly = false,
  exercise,
  sets,
  lastSession,
  workingMax = 0,
  referenceMax,
  loadPrescriptionMode = "kg",
  percentPlan = [],
  hasReferenceMax = false,
  onSaveReferenceMax,
  studentNote = "",
  onStudentNoteChange,
  onClose,
  onUpdateSet,
  onToggleComplete,
}: ExerciseExecutionDetailProps) => {
  const isPercent = loadPrescriptionMode === "percent";
  const [refDraft, setRefDraft] = useState("");
  const [refSaving, setRefSaving] = useState(false);
  const [showRefEdit, setShowRefEdit] = useState(false);

  const handleSaveRef = async () => {
    if (!onSaveReferenceMax) return;
    const next = parseFloat(refDraft.replace(",", "."));
    if (Number.isNaN(next) || next <= 0) return;
    setRefSaving(true);
    try {
      await onSaveReferenceMax(next);
      setRefDraft("");
      setShowRefEdit(false);
    } finally {
      setRefSaving(false);
    }
  };

  const categoryLabel = formatCategoryLabel(exercise.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#f8f8f8] text-black"
    >
      <div className="flex h-20 items-center justify-between border-b border-black/5 bg-white px-6">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efefef] text-black"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mx-4 min-w-0 flex-1 text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
            {exercise.letter} · {categoryLabel}
          </p>
          <h2 className="truncate font-sans text-lg font-bold uppercase text-black">{exercise.name}</h2>
        </div>
        <div className="h-10 w-10 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto pb-40">
        <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[1.75rem] bg-black p-6 text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
              <div className="mb-4 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[1.4px] opacity-60">
                <History className="h-3.5 w-3.5" />
                Histórico
              </div>
              {lastSession ? (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-sans text-3xl font-bold">{lastSession.load}</span>
                    <span className="font-mono text-[10px] font-bold opacity-40">KG</span>
                  </div>
                  <p className="text-[11px] font-medium opacity-60">
                    {lastSession.reps} REPS · {lastSession.date}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold italic opacity-30">Sem registros</p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-black/6 bg-white p-6 text-black shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="mb-4 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[1.4px] opacity-40">
                <Zap className="h-3.5 w-3.5" />
                {isPercent ? "Referência" : "Máxima"}
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-sans text-3xl font-bold">
                    {isPercent ? referenceMax?.max_load || "—" : workingMax || "0"}
                  </span>
                  <span className="font-mono text-[10px] font-bold opacity-40">KG</span>
                </div>
                {isPercent && onSaveReferenceMax && !readOnly ? (
                  <button
                    type="button"
                    onClick={() => setShowRefEdit((current) => !current)}
                    className="text-[10px] font-bold uppercase tracking-wider underline opacity-60"
                  >
                    Editar
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {showRefEdit && !readOnly ? (
            <div className="rounded-[1.75rem] bg-black p-6 text-white">
              <p className="mb-4 text-sm font-bold">Definir carga de referência (1RM)</p>
              <div className="flex gap-3">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={refDraft}
                  onChange={(event) => setRefDraft(event.target.value)}
                  className="h-12 rounded-full border-white/10 bg-white/10 text-center text-xl font-bold text-white focus:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveRef()}
                  className="rounded-full bg-white px-6 text-sm font-bold text-black"
                >
                  {refSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
              <Info className="h-3.5 w-3.5" />
              Prescrição
            </div>
            <p className="text-lg font-bold leading-tight text-black">{exercise.notes || "Sem observações específicas."}</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white">{exercise.prescription}</div>
            </div>
          </div>

          {exercise.video_url ? (
            <div className="overflow-hidden rounded-2xl border border-black/6 bg-black">
              <div className="flex items-center gap-2 px-4 py-3 text-white/60">
                <Play className="h-3.5 w-3.5" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Demo</span>
              </div>
              <VideoPreview url={exercise.video_url} />
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">
              <MessageSquare className="h-3.5 w-3.5" />
              Sua observação
            </div>
            <Textarea
              value={studentNote}
              onChange={(event) => onStudentNoteChange?.(event.target.value)}
              placeholder="Ex: Senti dor no joelho, baixei o peso..."
              className="min-h-[100px] rounded-[1.75rem] border-black/6 bg-[#f3f3f3] text-sm text-black placeholder:text-black/20 focus:border-black"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-black" />
              <h3 className="text-lg font-bold uppercase tracking-tight text-black">Execução</h3>
              <div className="h-px flex-1 bg-black/8" />
            </div>
            <div className="rounded-[1.75rem] border border-black/6 bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <ExecutionGridPremium
                sets={sets}
                readOnly={readOnly}
                suggestedReps={exercise.suggestedReps}
                suggestedRepsBySet={exercise.suggestedRepsBySet}
                loadPrescriptionMode={loadPrescriptionMode}
                percentPlan={percentPlan}
                hasReferenceMax={hasReferenceMax}
                suggestedLoad={exercise.suggestedLoad}
                suggestedLoadBySet={exercise.suggestedLoadBySet}
                exerciseId={exercise.id}
                onUpdateSet={(idx, field, value) => onUpdateSet(field, idx, value)}
                onToggleComplete={onToggleComplete}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[110] border-t border-black/5 bg-white p-6">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-black text-base font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.98]"
          >
            <Check className="h-5 w-5" strokeWidth={3} />
            {readOnly ? "Fechar revisão" : "Salvar e fechar"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ExerciseExecutionDetail;
