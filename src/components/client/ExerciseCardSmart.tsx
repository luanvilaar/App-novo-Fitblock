import React from 'react';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';
import type { ParsedExercise } from '@/lib/workoutParser';
import SmartExerciseTracker, { SmartSetLog } from './SmartExerciseTracker';

interface ExerciseCardSmartProps {
  exercise: ParsedExercise;
  // Tracking props (optional — only passed in execution mode)
  trackingLogs?: SmartSetLog[];
  onTrackingUpdate?: (
    setIdx: number,
    field: "load_used" | "reps_done" | "notes",
    value: string | number | null,
  ) => void;
}

const ExerciseCardSmart: React.FC<ExerciseCardSmartProps> = ({ exercise, trackingLogs, onTrackingUpdate }) => {
  // Limpar a URL do vídeo do texto das notas para não duplicar informação
  const displayNotes = exercise.notes 
    ? exercise.notes.replace(exercise.videoUrl || '', '').trim().replace(/^"|"$/g, '')
    : '';

  const numSets = exercise.sets ? parseInt(exercise.sets, 10) : 0;
  const isTracking = !!trackingLogs && !!onTrackingUpdate && numSets > 0;

  return (
    <div className="flex flex-col p-4 rounded-xl bg-card border border-border/40 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium text-sm sm:text-base tracking-tight">{exercise.name}</h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Vídeo
            </a>
          )}
          {exercise.load && (
            <span className="text-[10px] font-bold bg-energy/10 text-energy px-2 py-0.5 rounded-full uppercase tracking-wider">
              {exercise.load}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
        {exercise.rounds && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Rounds</span>
            <span className="text-sm font-medium">{exercise.rounds}</span>
          </div>
        )}
        {exercise.sets && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Séries</span>
            <span className="text-sm font-medium">{exercise.sets}</span>
          </div>
        )}
        {exercise.reps && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Reps</span>
            <span className="text-sm font-medium">{exercise.reps}</span>
          </div>
        )}
        {exercise.distance && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Distância</span>
            <span className="text-sm font-medium text-energy">{exercise.distance}</span>
          </div>
        )}
        {exercise.duration && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Tempo</span>
            <span className="text-sm font-medium">{exercise.duration}</span>
          </div>
        )}
        {exercise.pace && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Pace</span>
            <span className="text-sm font-medium italic">{exercise.pace}</span>
          </div>
        )}
      </div>

      {displayNotes && (
        <p className="text-xs text-muted-foreground font-light mt-2.5 leading-relaxed border-t border-border/30 pt-2 italic">
          "{displayNotes}"
        </p>
      )}

      {/* Tracking grid — only in execution mode */}
      {isTracking && (
        <SmartExerciseTracker
          exerciseName={exercise.name}
          sets={numSets}
          logs={trackingLogs!}
          onUpdate={onTrackingUpdate!}
        />
      )}
    </div>
  );
};


export default ExerciseCardSmart;
