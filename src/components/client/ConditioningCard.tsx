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
    <div className="overflow-hidden rounded-[1.75rem] border border-black/8 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
            {block.title}
          </h3>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] transition-colors hover:bg-[#e2e2e2]">
          <MoreHorizontal className="h-5 w-5 text-black/60" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {hasRawContent ? (
          <div className="space-y-1">
            {contentLines.map((line, i) => (
              <p key={i} className="text-base font-light leading-relaxed text-black/90">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {block.exercises.map((ex, i) => (
              <div key={i} className="text-base font-light leading-relaxed text-black/90">
                <span className="flex flex-wrap items-baseline gap-x-1.5">
                  {ex.rounds && <span className="font-bold">{ex.rounds}x</span>}
                  {ex.reps && <span className="font-bold">{ex.reps}</span>}
                  <span className="font-medium">{ex.name}</span>
                  {ex.load && (
                    <span className="font-semibold text-black">#{ex.load}</span>
                  )}
                  {ex.distance && (
                    <span className="text-black/70">{ex.distance}</span>
                  )}
                  {ex.duration && (
                    <span className="text-black/70">{ex.duration}</span>
                  )}
                </span>
                {ex.notes && (
                  <p className="mt-0.5 text-sm text-black/50">{ex.notes.trim()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Time Cap */}
        {block.timeCap && (
          <div className="mt-3 text-sm text-black/70">
            Time cap: {block.timeCap}min
          </div>
        )}

        {/* Additional Notes */}
        {block.notes && !hasRawContent && (
          <div className="mt-4 border-t border-black/8 pt-3">
            <p className="whitespace-pre-wrap text-sm text-black/70">{block.notes}</p>
          </div>
        )}

        {/* Circuit Note Input */}
        <div className="mt-4">
          <Input
            placeholder="Add circuit note"
            value={circuitNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="h-12 rounded-lg border-black/8 bg-[#f3f3f3] text-black placeholder:text-black/40"
          />
        </div>

        {/* Score Type Button */}
        <button className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black font-semibold text-white transition-colors hover:bg-black/90">
          <Trophy className="w-5 h-5" />
          <span className="text-lg">{scoreLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default ConditioningCard;
