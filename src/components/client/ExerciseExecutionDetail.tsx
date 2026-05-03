import { useMemo, useState } from "react";
import {
  ArrowLeft,
  History,
  Zap,
  Info,
  Target,
  Loader2,
  Check,
  Cpu,
  Play,
  Replace,
  MessageSquare,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import ExecutionGridPremium, { PremiumSetLog } from "./ExecutionGridPremium";
import VideoPreview from "@/components/VideoPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { PercentSetPlan } from "@/lib/load-percent";

const formatCategoryLabel = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .split(/[\s_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Geral";

interface ExerciseExecutionDetailProps {
  mode?: "structured" | "smart";
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
  /** Maior carga usada no histórico (treinos anteriores) */
  workingMax?: number;
  /** Prescrição em % ou kg */
  loadType?: string;
  /** Referência cadastrada (1RM) para cálculo de % */
  referenceMax?: { max_load: number; unit: string } | null;
  studentId?: string | null;
  loadPrescriptionMode?: "kg" | "percent";
  percentPlan?: PercentSetPlan[];
  hasReferenceMax?: boolean;
  onSaveReferenceMax?: (maxKg: number) => Promise<void>;
  /** Nome original na ficha (quando substituído) */
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
  mode = "structured",
  exercise,
  sets,
  lastSession,
  workingMax = 0,
  loadType,
  referenceMax,
  studentId,
  loadPrescriptionMode = "kg",
  percentPlan = [],
  hasReferenceMax = false,
  onSaveReferenceMax,
  originalExerciseName,
  isSubstituted = false,
  studentNote = "",
  onStudentNoteChange,
  exerciseCatalog = [],
  onSelectSubstitute,
  onClose,
  onUpdateSet,
  onToggleComplete,
}: ExerciseExecutionDetailProps) => {
  const isPercent = loadPrescriptionMode === "percent";
  const [refDraft, setRefDraft] = useState("");
  const [refSaving, setRefSaving] = useState(false);
  const [showRefEdit, setShowRefEdit] = useState(false);
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [subSearch, setSubSearch] = useState("");

  const filteredCatalog = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    if (!q) return exerciseCatalog.slice(0, 80);
    return exerciseCatalog.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 80);
  }, [exerciseCatalog, subSearch]);

  const handleSaveRef = async () => {
    if (!onSaveReferenceMax) return;
    const n = parseFloat(refDraft.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    setRefSaving(true);
    try {
      await onSaveReferenceMax(n);
      setRefDraft("");
      setShowRefEdit(false);
    } finally {
      setRefSaving(false);
    }
  };

  const catLabel = formatCategoryLabel(exercise.category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 10 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[#121212] pb-[calc(8rem+env(safe-area-inset-bottom))]"
    >
      {/* Cabeçalho — alinhado ao fluxo dashboard / WorkoutExecution */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#121212]/95 px-4 py-4 backdrop-blur-xl md:px-6">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mx-3 min-w-0 flex-1 text-center">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-primary">
            {exercise.letter} · {catLabel}
          </p>
          <h2 className="line-clamp-2 font-display text-base font-bold uppercase leading-tight tracking-tight text-white md:text-lg">
            {exercise.name}
          </h2>
          {mode === "structured" && isSubstituted && originalExerciseName && (
            <p className="mt-1 font-body text-[10px] text-white/45">
              Prescrito: <span className="text-white/65">{originalExerciseName}</span>
            </p>
          )}
        </div>
        <div className="h-10 w-10 shrink-0" aria-hidden />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        {/* Resumo — cards como TrainerPanelCard / lista de exercícios */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-4 shadow-2xl transition-colors md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Última sessão
              </span>
            </div>
            {lastSession ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold leading-none text-white">{lastSession.load}</span>
                  <span className="font-mono text-[10px] font-bold uppercase text-white/45">kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-[11px] text-white/50">{lastSession.reps} reps</span>
                  <div className="h-1 w-1 rounded-full bg-white/15" />
                  <span className="font-mono text-[9px] text-white/35">{lastSession.date}</span>
                </div>
              </div>
            ) : (
              <p className="font-body text-xs text-white/40">Sem histórico ainda</p>
            )}
          </div>

          <div className="rounded-2xl border border-primary/20 bg-[#161616] p-4 shadow-[0_0_24px_rgba(65,31,128,0.06)] md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-primary">
                {isPercent ? "Referência 1RM" : "Carga máxima"}
              </span>
            </div>
            {isPercent ? (
              <div className="space-y-2">
                {referenceMax && referenceMax.max_load > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold leading-none text-white">{referenceMax.max_load}</span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary/70">
                        {referenceMax.unit}
                      </span>
                    </div>
                    {onSaveReferenceMax && !showRefEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRefEdit(true);
                          setRefDraft(String(referenceMax.max_load));
                        }}
                        className="text-left font-body text-xs text-primary/80 underline-offset-2 hover:text-primary hover:underline"
                      >
                        Alterar referência
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="font-display text-3xl font-bold leading-none text-white/20">—</span>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold leading-none text-white">{workingMax || "0"}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary/70">kg</span>
              </div>
            )}
          </div>
        </div>

        {mode === "structured" &&
          isPercent &&
          loadType === "percent" &&
          studentId &&
          onSaveReferenceMax &&
          (!referenceMax || referenceMax.max_load <= 0 || showRefEdit) && (
          <div className="relative space-y-5 overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 md:p-8">
            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.07]">
              <Cpu className="h-16 w-16 text-primary" />
            </div>
            <div className="relative z-10 space-y-2">
              <h4 className="font-display text-lg font-bold uppercase tracking-tight text-white md:text-xl">Definir referência</h4>
              <p className="font-body text-sm leading-relaxed text-white/60">
                Este treino usa intensidade em %. Indica a tua carga de referência (1RM) para calcular as sugestões de peso.
              </p>
            </div>
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <label className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-primary">Carga máxima (kg)</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={refDraft}
                  onChange={(e) => setRefDraft(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-black/40 text-center font-display text-2xl font-bold text-white focus:border-primary md:h-14"
                />
              </div>
              <button
                type="button"
                disabled={refSaving || !refDraft.trim()}
                onClick={handleSaveRef}
                className="flex h-12 min-w-[120px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:border-energy/45 hover:bg-energy/10 disabled:opacity-50 sm:h-14"
              >
                {refSaving ? <Loader2 className="h-5 w-5 animate-spin text-energy" /> : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* Prescrição e vídeo */}
        <div className="space-y-4">
          {mode === "structured" && onSelectSubstitute && (
            <div className="space-y-3">
              {!substituteOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 rounded-2xl border-white/15 bg-white/[0.04] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:border-primary/40 hover:bg-primary/10"
                  onClick={() => setSubstituteOpen(true)}
                >
                  <Replace className="h-4 w-4 text-primary" />
                  Substituir exercício
                </Button>
              ) : (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#161616] p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                      Escolher do catálogo
                    </span>
                  </div>
                  <Input
                    placeholder="Pesquisar…"
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="border-white/10 bg-black/30 text-sm text-white placeholder:text-white/35"
                  />
                  <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                    <button
                      type="button"
                      className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-left font-body text-sm text-white/80 transition-colors hover:border-primary/30 hover:bg-primary/[0.07]"
                      onClick={() => {
                        onSelectSubstitute(null);
                        setSubstituteOpen(false);
                        setSubSearch("");
                      }}
                    >
                      Voltar ao prescrito
                    </button>
                    {filteredCatalog.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className="flex w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-left font-body text-sm text-white/70 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                        onClick={() => {
                          onSelectSubstitute(row.id);
                          setSubstituteOpen(false);
                          setSubSearch("");
                        }}
                      >
                        {row.name}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-white/50 hover:text-white/80"
                    onClick={() => {
                      setSubstituteOpen(false);
                      setSubSearch("");
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616] p-5 shadow-2xl md:p-6">
            <div className="absolute right-0 top-0 h-1 w-20 rounded-bl-lg bg-primary/40" />
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Info className="h-5 w-5 text-primary/80" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Prescrição do treinador</p>
                <p className="border-l-2 border-primary/50 pl-4 font-body text-base italic leading-relaxed text-white/85">
                  {exercise.notes || `${exercise.name} ${exercise.prescription}`}
                </p>
                <div className="pt-1">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Séries e volume</span>
                  <p className="font-display text-lg font-bold uppercase tracking-tight text-white md:text-xl">{exercise.prescription}</p>
                </div>
              </div>
            </div>
          </div>

          {exercise.video_url && (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <Play className="h-4 w-4 text-primary" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  Vídeo de referência
                </span>
              </div>
              <VideoPreview url={exercise.video_url} />
            </div>
          )}

          {mode === "structured" && onStudentNoteChange && (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616] p-5 shadow-2xl md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-primary">
                  Observações para o treinador
                </span>
              </div>
              <Textarea
                value={studentNote}
                onChange={(e) => onStudentNoteChange(e.target.value)}
                placeholder="Dor, equipamento, dúvidas… (opcional)"
                className="min-h-[100px] resize-y border-white/10 bg-black/30 text-sm text-white placeholder:text-white/30"
              />
            </div>
          )}
        </div>

        {/* Registo de séries */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-white md:text-xl">Registo de séries</h3>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-2 shadow-2xl">
            <ExecutionGridPremium
              sets={sets}
              suggestedReps={exercise.suggestedReps}
              suggestedRepsBySet={exercise.suggestedRepsBySet}
              loadPrescriptionMode={loadPrescriptionMode}
              percentPlan={percentPlan}
              hasReferenceMax={hasReferenceMax}
              suggestedLoad={exercise.suggestedLoad}
              suggestedLoadBySet={exercise.suggestedLoadBySet}
              exerciseId={exercise.id}
              onUpdateSet={(idx, field, val) => onUpdateSet(field, idx, val)}
              onToggleComplete={onToggleComplete}
            />
          </div>
        </div>
      </div>

      {/* CTA — acima da bottom nav do layout */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[110] flex justify-center bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-14 w-full max-w-lg items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] font-mono text-xs font-bold uppercase tracking-[0.14em] text-white shadow-2xl transition-all hover:border-energy/50 hover:bg-energy/10 md:max-w-2xl md:text-sm"
        >
          <Check className="h-5 w-5 text-energy" strokeWidth={2.5} />
          Guardar e voltar
        </button>
      </div>
    </motion.div>
  );
};

export default ExerciseExecutionDetail;
