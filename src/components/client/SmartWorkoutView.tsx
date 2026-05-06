import React from 'react';
import { ParsedWorkout } from '@/lib/workoutParser';
import { FileText } from 'lucide-react';
import WorkoutBlockCard from './WorkoutBlockCard';
import { SmartSetLog } from './SmartExerciseTracker';

interface SmartWorkoutViewProps {
  workout: ParsedWorkout;
  mode?: 'full' | 'minimal';
  // Tracking props (optional for execution mode)
  trackingLogs?: Record<string, SmartSetLog[]>;
  onTrackingUpdate?: (exerciseName: string, setIdx: number, field: keyof SmartSetLog, value: any) => void;
  onExerciseClick?: (exerciseName: string) => void;
}

export const SmartWorkoutView: React.FC<SmartWorkoutViewProps> = ({ 
  workout, 
  mode = 'full',
  trackingLogs, 
  onTrackingUpdate,
  onExerciseClick
}) => {
  if (!workout.blocks.length && !workout.globalNotes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-light">Comece a escrever para ver o preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {workout.blocks.map((block, idx) => (
        <WorkoutBlockCard 
          key={idx} 
          block={block} 
          mode={mode}
          trackingLogs={trackingLogs}
          onTrackingUpdate={onTrackingUpdate}
          onExerciseClick={onExerciseClick}
        />
      ))}

      {workout.globalNotes && (
        <div className="mt-12 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Regras e Notas
            </h3>
          </div>
          <p className="text-sm font-light text-muted-foreground whitespace-pre-wrap">
            {workout.globalNotes}
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartWorkoutView;
