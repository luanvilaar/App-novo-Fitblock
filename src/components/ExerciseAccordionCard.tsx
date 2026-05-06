import { ChevronDown, Link2, History, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoPreview from "@/components/VideoPreview";
import { motion, AnimatePresence } from "framer-motion";

interface SetLog {
  set_number: number;
  reps_done: number | null;
  load_used: number | null;
  notes: string;
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  suggested_load: string | null;
  notes: string | null;
  sort_order: number;
  superset_group_id: string | null;
  video_url: string | null;
  exercises: { id: string; name: string; category: string } | null;
}

interface ExerciseAccordionCardProps {
  exercises: WorkoutExercise[];
  isBiSet: boolean;
  isOpen: boolean;
  onToggle: () => void;
  logs: Record<string, SetLog[]>;
  loadHistory: Record<string, { date: string; load: number; reps: number }[]>;
  historyOpen: Record<string, boolean>;
  setHistoryOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  substitutionOpen: Record<string, boolean>;
  setSubstitutionOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  substitutionText: Record<string, string>;
  setSubstitutionText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateSet: (exerciseId: string, setIdx: number, field: keyof SetLog, value: any) => void;
  index: number;
}

const ExerciseAccordionCard = ({
  exercises: exList,
  isBiSet,
  isOpen,
  onToggle,
  logs,
  loadHistory,
  historyOpen,
  setHistoryOpen,
  substitutionOpen,
  setSubstitutionOpen,
  substitutionText,
  setSubstitutionText,
  updateSet,
  index,
}: ExerciseAccordionCardProps) => {
  // Build prescription summary for collapsed state
  const prescriptionSummary = exList
    .map((ex) => {
      const load = ex.suggested_load ? ` • ${ex.suggested_load}` : "";
      return `${ex.sets}x${ex.reps}${load}`;
    })
    .join(" / ");

  const title = isBiSet
    ? exList.map((ex) => ex.exercises?.name).join(" + ")
    : exList[0]?.exercises?.name || "Exercício";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-shadow duration-300 ${
        isOpen ? "shadow-[0_0_24px_hsl(var(--primary)/0.08)]" : ""
      } ${isBiSet ? "border-l-4 border-l-accent" : ""}`}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[56px] text-left active:bg-secondary/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-display truncate">{title}</h3>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{prescriptionSummary}</p>
        </div>
        {isBiSet && (
          <span className="text-[9px] font-bold text-accent bg-accent/15 rounded-md px-1.5 py-0.5 flex-shrink-0">
            BI-SET
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0">
              {exList.map((ex, exIdx) => (
                <div key={ex.id} className={exIdx > 0 ? "mt-4 pt-4 border-t border-border/50" : ""}>
                  {/* Exercise name + substitute (only show name again in biset) */}
                  {isBiSet && (
                    <h4 className="text-xs font-bold font-display text-foreground/80 mb-1">{ex.exercises?.name}</h4>
                  )}
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <p className="text-[10px] text-muted-foreground">
                      {ex.sets}x{ex.reps} {ex.suggested_load ? `• ${ex.suggested_load}` : ""}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubstitutionOpen((prev) => ({ ...prev, [ex.exercise_id]: !prev[ex.exercise_id] }));
                      }}
                      className={`text-[10px] h-6 px-2 border transition-colors flex-shrink-0 ${
                        substitutionOpen[ex.exercise_id]
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "text-primary border-primary/30 hover:bg-primary hover:text-white"
                      }`}
                    >
                      {substitutionOpen[ex.exercise_id] ? "Cancelar" : "Substituir"}
                    </Button>
                  </div>

                  {ex.notes && <p className="text-[10px] text-muted-foreground mb-3 italic">{ex.notes}</p>}
                  {ex.video_url && <VideoPreview url={ex.video_url} className="mb-3" />}

                  {/* Load History */}
                  {loadHistory[ex.exercise_id] && loadHistory[ex.exercise_id].length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryOpen((prev) => ({ ...prev, [ex.exercise_id]: !prev[ex.exercise_id] }));
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors mb-1"
                      >
                        <History className="w-3 h-3" />
                        Histórico de cargas
                      </button>
                      <AnimatePresence>
                        {historyOpen[ex.exercise_id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-secondary/50 rounded-lg p-2 space-y-1 border border-border/50">
                              {loadHistory[ex.exercise_id].map((entry, hIdx) => (
                                <div key={hIdx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-muted-foreground">{entry.date}</span>
                                  <span className="font-bold text-foreground">
                                    {entry.load}kg × {entry.reps} reps
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Substitution */}
                  {substitutionOpen[ex.exercise_id] && (
                    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
                      <p className="mb-2 text-xs font-bold text-primary">O que você fez no lugar e por quê?</p>
                      <textarea
                        placeholder="Ex: Fiz Air Squat pois senti o joelho"
                        value={substitutionText[ex.exercise_id] || ""}
                        onChange={(e) => {
                          setSubstitutionText((prev) => ({ ...prev, [ex.exercise_id]: e.target.value }));
                          updateSet(ex.exercise_id, 0, "notes", `[SUBSTITUÍDO] ${e.target.value}`);
                        }}
                        className="w-full h-16 text-sm bg-background border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Quadro de acompanhamento de cargas - UX Premium */}
                  {!substitutionOpen[ex.exercise_id] && (
                    <div className="mt-4 border border-border/40 rounded-xl overflow-hidden bg-card shadow-sm">
                      {/* Cabeçalho do Quadro */}
                      <div className="grid grid-cols-12 bg-secondary/40 border-b border-border/40 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground py-2.5 px-3">
                        <span className="col-span-2 text-center">Série</span>
                        <span className="col-span-3 text-center border-l border-border/20">Reps</span>
                        <span className="col-span-3 text-center border-l border-border/20">Carga</span>
                        <span className="col-span-4 text-center border-l border-border/20">Observações</span>
                      </div>

                      <div className="divide-y divide-border/20">
                        {(logs[ex.exercise_id] || []).map((set, setIdx) => {
                          const totalSets = (logs[ex.exercise_id] || []).length;
                          const handleEnterNav = (e: React.KeyboardEvent<HTMLInputElement>, col: number) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextSetIdx = setIdx + 1;
                              if (nextSetIdx < totalSets) {
                                const next = document.querySelector<HTMLInputElement>(
                                  `[data-ex="${ex.exercise_id}"][data-set="${nextSetIdx}"][data-col="${col}"]`
                                );
                                next?.focus();
                              }
                            }
                          };

                          return (
                            <div key={setIdx} className="grid grid-cols-12 items-center divide-x divide-border/20 group hover:bg-muted/30 transition-colors">
                              {/* Número da Série */}
                              <div className="col-span-2 flex items-center justify-center py-2.5 bg-secondary/10">
                                <span className="text-xs font-black text-muted-foreground/60">{set.set_number}º</span>
                              </div>

                              {/* Repetições Realizadas */}
                              <div className="col-span-3 px-1">
                                <Input
                                  type="number"
                                  placeholder={ex.reps}
                                  value={set.reps_done ?? ""}
                                  onChange={(e) =>
                                    updateSet(ex.exercise_id, setIdx, "reps_done", e.target.value ? Number(e.target.value) : null)
                                  }
                                  onKeyDown={(e) => handleEnterNav(e, 1)}
                                  data-ex={ex.exercise_id}
                                  data-set={setIdx}
                                  data-col={1}
                                  className="h-9 border-none bg-transparent text-center text-sm font-medium focus-visible:ring-0 px-0 placeholder:opacity-30"
                                />
                              </div>

                              {/* Carga Utilizada - Coluna de Destaque */}
                              <div className="col-span-3 px-1 bg-primary/[0.02]">
                                <div className="relative flex items-center justify-center">
                                  <Input
                                    type="number"
                                    placeholder={ex.suggested_load || "-"}
                                    value={set.load_used ?? ""}
                                    onChange={(e) =>
                                      updateSet(ex.exercise_id, setIdx, "load_used", e.target.value ? Number(e.target.value) : null)
                                    }
                                    onKeyDown={(e) => handleEnterNav(e, 2)}
                                    data-ex={ex.exercise_id}
                                    data-set={setIdx}
                                    data-col={2}
                                    className="h-9 border-none bg-transparent text-center text-sm font-bold text-primary focus-visible:ring-0 px-0 placeholder:text-primary/20"
                                  />
                                  {set.load_used && (
                                    <span className="absolute right-1 text-[8px] font-bold text-primary/40 pointer-events-none">kg</span>
                                  )}
                                </div>
                              </div>

                              {/* Feedback / Observações */}
                              <div className="col-span-4 px-2">
                                <Input
                                  placeholder="Como foi?"
                                  value={set.notes}
                                  onChange={(e) => updateSet(ex.exercise_id, setIdx, "notes", e.target.value)}
                                  onKeyDown={(e) => handleEnterNav(e, 3)}
                                  data-ex={ex.exercise_id}
                                  data-set={setIdx}
                                  data-col={3}
                                  className="h-9 border-none bg-transparent text-[11px] text-muted-foreground/80 placeholder:text-muted-foreground/30 focus-visible:ring-0 px-1 truncate italic"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExerciseAccordionCard;
