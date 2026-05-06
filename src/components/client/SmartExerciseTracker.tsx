import React, { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Dumbbell, MessageSquare } from 'lucide-react';

export interface SmartSetLog {
  set_number: number;
  load_used: number | null;
  reps_done: number | null;
  notes?: string;
  is_completed?: boolean;
}

type SmartEditableField = "load_used" | "reps_done" | "notes";

interface SmartExerciseTrackerProps {
  exerciseName: string;
  sets: number;
  logs: SmartSetLog[];
  onUpdate: (setIdx: number, field: SmartEditableField, value: string | number | null) => void;
}

const SmartExerciseTracker: React.FC<SmartExerciseTrackerProps> = ({
  exerciseName,
  sets,
  logs,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count filled sets for badge
  const filledSets = logs.filter(s => s.load_used !== null && s.load_used > 0).length;
  const blockNote = logs.find(l => (l.notes || '').trim())?.notes || '';

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200
          ${isOpen
            ? 'border border-black/12 bg-[#efefef]'
            : 'border border-black/8 bg-[#f8f8f8] hover:bg-[#efefef]'
          }`}
      >
        <div className="flex items-center gap-2">
          <Dumbbell className={`w-3.5 h-3.5 ${isOpen ? 'text-black' : 'text-muted-foreground'}`} />
          <span className={`text-[11px] font-semibold tracking-wide ${isOpen ? 'text-black' : 'text-muted-foreground'}`}>
            Registrar Cargas
          </span>
          {filledSets > 0 && !isOpen && (
            <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">
              {filledSets}/{sets}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Tracking grid */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="tracker"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-12 bg-secondary/30 border-b border-border/30 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground py-2 px-2">
                <span className="col-span-2 text-center">Série</span>
                <span className="col-span-4 text-center border-l border-border/20">Reps</span>
                <span className="col-span-6 text-center border-l border-border/20">Carga</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/15">
                {logs.map((set, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center group hover:bg-muted/20 transition-colors"
                  >
                    {/* Set number */}
                    <div className="col-span-2 flex items-center justify-center py-2.5 bg-secondary/10">
                      <span className="text-xs font-black text-muted-foreground/50">{set.set_number}º</span>
                    </div>

                    {/* Reps input */}
                    <div className="col-span-4 px-1 border-l border-border/15">
                      <div className="relative flex items-center justify-center">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          value={set.reps_done ?? ''}
                          onChange={e => onUpdate(idx, 'reps_done', e.target.value ? Number(e.target.value) : null)}
                          className="h-10 border-none bg-transparent text-center text-sm font-bold focus-visible:ring-0 px-0 placeholder:text-muted-foreground/25 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Load input */}
                    <div className="col-span-6 px-1 border-l border-border/15">
                      <div className="relative flex items-center justify-center">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          value={set.load_used ?? ''}
                          onChange={e => onUpdate(idx, 'load_used', e.target.value ? Number(e.target.value) : null)}
                          className="h-10 border-none bg-transparent px-0 text-center text-sm font-bold text-black focus-visible:ring-0 placeholder:text-muted-foreground/25 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {set.load_used !== null && set.load_used > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pointer-events-none absolute right-1.5 text-[8px] font-bold text-black/40"
                          >
                            kg
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block note (single) */}
            <div className="mt-2 rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/30 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                Observação do bloco
              </div>
              <div className="p-2">
                <Textarea
                  placeholder="Como foi no geral? (feedback para o treinador)"
                  value={blockNote}
                  onChange={(e) => onUpdate(0, 'notes', e.target.value)}
                  className="min-h-[80px] bg-transparent border-border/30 focus-visible:ring-0 text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartExerciseTracker;
