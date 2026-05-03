import React, { useMemo, useState } from 'react';
import { Trophy, MoreHorizontal } from 'lucide-react';
import type { ParsedBlock } from '@/lib/workoutParser';
import { Input } from '@/components/ui/input';

interface ConditioningCardProps {
  block: ParsedBlock;
  rawContent?: string;
  onNoteChange?: (note: string) => void;
}

const ConditioningCard: React.FC<ConditioningCardProps> = ({
  block,
  rawContent,
  onNoteChange,
}) => {
  const formatType = block.formatType || '';
  const [circuitNote, setCircuitNote] = useState('');

  const hasRawContent = rawContent || (block.exercises.length === 0 && block.notes);
  const contentToDisplay = rawContent || block.notes || '';
  
  const contentLines = useMemo(() => {
    if (!contentToDisplay) return [];
    return contentToDisplay.split('\n').filter(line => line.trim());
  }, [contentToDisplay]);

  const scoreLabel = useMemo(() => {
    const ft = formatType.toUpperCase();
    if (ft.includes('FOR_TIME') || ft === 'FOR TIME') return 'For Time';
    if (ft.includes('AMRAP')) return 'AMRAP';
    if (ft.includes('EMOM') || ft.includes('E2MOM') || ft.includes('E3MOM') || ft.includes('E4MOM')) return formatType.replace(/_/g, '');
    if (ft.includes('NOT_FOR_TIME')) return 'Not For Time';
    return formatType.replace(/_/g, ' ') || 'Conditioning';
  }, [formatType]);

  const handleNoteChange = (value: string) => {
    setCircuitNote(value);
    onNoteChange?.(value);
  };

  return (
    <div className="bg-[#0E0E0C] rounded-xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
            {block.title}
          </h3>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {hasRawContent ? (
          <div className="space-y-1">
            {contentLines.map((line, i) => (
              <p key={i} className="text-white/90 text-base leading-relaxed font-light">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {block.exercises.map((ex, i) => (
              <div key={i} className="text-white/90 text-base leading-relaxed font-light">
                <span className="flex flex-wrap items-baseline gap-x-1.5">
                  {ex.rounds && <span className="font-bold">{ex.rounds}x</span>}
                  {ex.reps && <span className="font-bold">{ex.reps}</span>}
                  <span className="font-medium">{ex.name}</span>
                  {ex.load && (
                    <span className="text-energy font-semibold">#{ex.load}</span>
                  )}
                  {ex.distance && (
                    <span className="text-white/70">{ex.distance}</span>
                  )}
                  {ex.duration && (
                    <span className="text-white/70">{ex.duration}</span>
                  )}
                </span>
                {ex.notes && (
                  <p className="text-white/50 text-sm mt-0.5">{ex.notes.trim()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Time Cap */}
        {block.timeCap && (
          <div className="mt-3 text-white/70 text-sm">
            Time cap: {block.timeCap}min
          </div>
        )}

        {/* Additional Notes */}
        {block.notes && !hasRawContent && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-white/70 text-sm whitespace-pre-wrap">{block.notes}</p>
          </div>
        )}

        {/* Circuit Note Input */}
        <div className="mt-4">
          <Input
            placeholder="Add circuit note"
            value={circuitNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-lg focus:border-energy"
          />
        </div>

        {/* Score Type Button */}
        <button className="mt-4 w-full h-14 bg-[#6366F1] hover:bg-[#5558E8] text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors">
          <Trophy className="w-5 h-5" />
          <span className="text-lg">{scoreLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default ConditioningCard;
