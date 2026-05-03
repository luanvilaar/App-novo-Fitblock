import React from 'react';
import { Link2, PlayCircle } from 'lucide-react';
import type { ParsedExercise } from '@/lib/workoutParser';
import SmartExerciseTracker, { SmartSetLog } from './SmartExerciseTracker';

interface BiSetCardProps {
  exercises: ParsedExercise[];
  // Tracking props (optional — only passed in execution mode)
  trackingLogs?: Record<string, SmartSetLog[]>;
  onTrackingUpdate?: (exerciseName: string, setIdx: number, field: 'load_used' | 'reps_done' | 'notes', value: any) => void;
}

const BiSetCard: React.FC<BiSetCardProps> = ({ exercises, trackingLogs, onTrackingUpdate }) => {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      {/* Bi-set header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <Link2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Bi-Set
        </span>
      </div>

      {/* Exercises */}
      <div className="divide-y divide-amber-500/15">
        {exercises.map((ex, i) => {
          // Limpar a URL do vídeo do texto das notas
          const displayNotes = ex.notes 
            ? ex.notes.replace(ex.videoUrl || '', '').trim().replace(/^"|"$/g, '')
            : '';

          const numSets = ex.sets ? parseInt(ex.sets, 10) : 0;
          const isTracking = !!trackingLogs && !!onTrackingUpdate && numSets > 0;
          const exerciseLogs = trackingLogs?.[ex.name] || [];

          return (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-sm sm:text-base tracking-tight">{ex.name}</h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Vídeo
                    </a>
                  )}
                  {ex.load && (
                    <span className="text-[10px] font-bold bg-energy/10 text-energy px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {ex.load}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
                {ex.rounds && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Rounds</span>
                    <span className="text-sm font-medium">{ex.rounds}</span>
                  </div>
                )}
                {ex.sets && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Séries</span>
                    <span className="text-sm font-medium">{ex.sets}</span>
                  </div>
                )}
                {ex.reps && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Reps</span>
                    <span className="text-sm font-medium">{ex.reps}</span>
                  </div>
                )}
                {ex.distance && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Distância</span>
                    <span className="text-sm font-medium text-energy">{ex.distance}</span>
                  </div>
                )}
                {ex.duration && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Tempo</span>
                    <span className="text-sm font-medium">{ex.duration}</span>
                  </div>
                )}
                {ex.pace && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Pace</span>
                    <span className="text-sm font-medium italic">{ex.pace}</span>
                  </div>
                )}
              </div>

              {displayNotes && (
                <p className="text-xs text-muted-foreground font-light mt-1.5 italic">
                  "{displayNotes}"
                </p>
              )}

              {/* Tracking grid — only in execution mode */}
              {isTracking && (
                <SmartExerciseTracker
                  exerciseName={ex.name}
                  sets={numSets}
                  logs={exerciseLogs}
                  onUpdate={(setIdx, field, value) => onTrackingUpdate(ex.name, setIdx, field, value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Execution hint */}
      <div className="px-4 py-2 bg-amber-500/5 border-t border-amber-500/15">
        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 italic">
          Alternado sem descanso entre os exercícios
        </p>
      </div>
    </div>
  );
};

export default BiSetCard;
