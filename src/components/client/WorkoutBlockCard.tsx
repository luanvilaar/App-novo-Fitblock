import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Dumbbell, Zap, Heart } from 'lucide-react';
import type { ParsedBlock, ParsedExercise } from '@/lib/workoutParser';
import ExerciseCardSmart from './ExerciseCardSmart';
import BiSetCard from './BiSetCard';
import ConditioningCard from './ConditioningCard';
import { SmartSetLog } from './SmartExerciseTracker';
import MinimalExerciseListItem from './MinimalExerciseListItem';

interface WorkoutBlockCardProps {
  block: ParsedBlock;
  mode?: 'full' | 'minimal';
  // Tracking props (optional)
  trackingLogs?: Record<string, SmartSetLog[]>;
  onTrackingUpdate?: (exerciseName: string, setIdx: number, field: keyof SmartSetLog, value: any) => void;
  onExerciseClick?: (exerciseName: string) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  AQUECIMENTO: <Heart className="w-4 h-4 text-energy" />,
  WARMUP: <Heart className="w-4 h-4 text-energy" />,
  FORÇA: <Dumbbell className="w-4 h-4 text-energy" />,
  STRENGTH: <Dumbbell className="w-4 h-4 text-energy" />,
  METCON: <Zap className="w-4 h-4 text-energy" />,
  CONDICIONAMENTO: <Zap className="w-4 h-4 text-energy" />,
  WOD: <Zap className="w-4 h-4 text-energy" />,
};

function isConditioningBlock(block: ParsedBlock): boolean {
  if (block.formatType) return true;
  const upper = block.title.toUpperCase();
  return ['CONDICIONAMENTO', 'WOD', 'METCON', 'ENDURANCE'].some(k => upper.includes(k));
}

function groupBiSets(exercises: ParsedExercise[]): Array<{ type: 'single' | 'biset'; exercises: ParsedExercise[] }> {
  const groups: Array<{ type: 'single' | 'biset'; exercises: ParsedExercise[] }> = [];
  let i = 0;

  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.isBiSet) {
      // Collect consecutive bi-set exercises
      const biSetGroup: ParsedExercise[] = [ex];
      let j = i + 1;
      while (j < exercises.length && exercises[j].isBiSet) {
        biSetGroup.push(exercises[j]);
        j++;
      }
      groups.push({ type: 'biset', exercises: biSetGroup });
      i = j;
    } else {
      groups.push({ type: 'single', exercises: [ex] });
      i++;
    }
  }

  return groups;
}

const WorkoutBlockCard: React.FC<WorkoutBlockCardProps> = (props) => {
  const { block, mode = 'full', trackingLogs, onTrackingUpdate, onExerciseClick: _onExerciseClick } = props;
  const icon = BLOCK_ICONS[block.title.toUpperCase()] || <Activity className="w-4 h-4 text-energy" />;

  // Conditioning blocks get a dedicated card
  if (isConditioningBlock(block)) {
    const blockLabel = String.fromCharCode(65 + (block.exercises.length > 0 ? 0 : 0));
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-sm text-muted-foreground mb-2 font-light">
          {blockLabel}. Conditioning
        </div>
        <ConditioningCard block={block} defaultExpanded={true} />
      </motion.div>
    );
  }

  // Strength / regular blocks: group bi-sets and render individual cards
  const groups = groupBiSets(block.exercises);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-energy/15 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-light tracking-tight uppercase">{block.title}</h3>
          {block.formatType && (
            <span className="text-[10px] font-bold text-energy tracking-[0.2em]">
              {block.formatType} {block.rounds ? `| ${block.rounds} ROUNDS` : ''}
              {block.timeCap ? ` | TC: ${block.timeCap}'` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {groups.map((group, idx) => {
          if (mode === 'minimal') {
            const ex = group.exercises[0];
            const label = String.fromCharCode(65 + idx);
            const prescription = `${ex.sets || '0'}x${ex.reps || '0'}${ex.load ? ` @ ${ex.load}` : ''}`;
            
            return (
              <MinimalExerciseListItem
                key={idx}
                letter={label}
                name={ex.name}
                prescription={prescription}
                category={block.title}
                index={idx}
                onClick={() => {
                  if (typeof _onExerciseClick === 'function') {
                    _onExerciseClick(ex.name);
                  }
                }}
              />
            );
          }

          // Legacy/Preview mode: use full cards
          return group.type === 'biset' ? (
            <BiSetCard 
              key={idx} 
              exercises={group.exercises} 
              trackingLogs={trackingLogs}
              onTrackingUpdate={onTrackingUpdate}
            />
          ) : (
            <ExerciseCardSmart 
              key={idx} 
              exercise={group.exercises[0]} 
              trackingLogs={trackingLogs?.[group.exercises[0].name]}
              onTrackingUpdate={(setIdx, field, value) => 
                onTrackingUpdate?.(group.exercises[0].name, setIdx, field, value)
              }
            />
          );
        })}
      </div>

      {block.notes && (
        <div className="mt-4 p-3 bg-secondary/20 rounded-xl border border-border/30">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{block.notes}</p>
        </div>
      )}
    </motion.div>
  );
};

export default WorkoutBlockCard;
