import React from 'react';
import { cn } from '@/lib/utils';
import type { TokenType } from '@/lib/workout-parser/types';

interface SpreadsheetRowProps {
  lineNumber: number;
  content: string;
  tokenType: TokenType;
  isFocused: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  isFirst?: boolean;
}

const TOKEN_BADGE: Record<TokenType, { label: string; className: string } | null> = {
  BLOCK_HEADER: { label: 'BLOCK', className: 'bg-primary/20 text-primary border-primary/30' },
  EXERCISE: { label: 'EXERCISE', className: 'bg-white/10 text-white border-white/20' },
  EXERCISE_BISET: { label: 'BI-SET', className: 'bg-primary/10 text-primary border-primary/20' },
  EXERCISE_COMBINED: { label: 'COMBINED', className: 'bg-white/5 text-white/60 border-white/10' },
  FORMAT_INDICATOR: { label: 'FORMAT', className: 'bg-white/10 text-white border-white/20' },
  PRESCRIPTION: { label: 'DATA', className: 'bg-white/5 text-white/40 border-white/10' },
  SEPARATOR: { label: 'NOTE', className: 'bg-white/5 text-white/20 border-white/10' },
  TEXT: { label: 'NOTA', className: 'bg-amber-500/10 text-amber-200/80 border-amber-500/25' },
  EMPTY: null,
};

const TOKEN_INPUT_CLASS: Record<TokenType, string> = {
  BLOCK_HEADER: 'font-display text-lg uppercase tracking-tight text-primary',
  EXERCISE: 'font-mono text-sm tracking-widest text-white font-bold',
  EXERCISE_BISET: 'font-mono text-sm tracking-widest text-primary/80',
  EXERCISE_COMBINED: 'font-mono text-sm tracking-widest text-white/70',
  FORMAT_INDICATOR: 'font-mono text-xs uppercase tracking-[0.3em] text-white font-black',
  PRESCRIPTION: 'font-mono text-xs tracking-widest text-white/50 italic',
  SEPARATOR: 'font-mono text-[10px] text-white/20 uppercase tracking-widest',
  TEXT: 'font-mono text-sm text-white/40',
  EMPTY: '',
};

const SpreadsheetRow: React.FC<SpreadsheetRowProps> = ({
  lineNumber,
  content,
  tokenType,
  isFocused,
  inputRef,
  onChange,
  onKeyDown,
  onFocus,
  onPaste,
  isFirst,
}) => {
  const badge = TOKEN_BADGE[tokenType];

  return (
    <div
      className={cn(
        'flex items-stretch border-b border-white/5 transition-all group relative',
        isFocused
          ? 'bg-primary/5 before:absolute before:left-0 before:top-0 before:w-[3px] before:h-full before:bg-primary shadow-[inset_10px_0_30px_rgba(65,31,128,0.03)]'
          : 'hover:bg-white/[0.01]'
      )}
    >
      {/* Line number gutter */}
      <div className="w-10 sm:w-14 flex items-center justify-center text-[10px] text-white/20 font-mono border-r border-white/5 bg-black/40 select-none flex-shrink-0">
        {lineNumber.toString().padStart(2, '0')}
      </div>

      {/* Input cell */}
      <input
        ref={inputRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onPaste={onPaste}
        className={cn(
          'flex-1 min-w-0 px-4 py-3 bg-transparent border-none focus:ring-0 text-sm tracking-wide outline-none placeholder:text-white/10 transition-all',
          TOKEN_INPUT_CLASS[tokenType]
        )}
        placeholder={isFirst ? 'EX: *WOD_AMRAP* OU -BACK_SQUAT-' : ''}
        spellCheck={false}
        autoComplete="off"
      />

      {/* Token type badge */}
      <div className="w-24 sm:w-28 flex items-center justify-center flex-shrink-0 border-l border-white/5 bg-black/20">
        {badge && content.trim() && (
          <span
            className={cn(
              'text-[7px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 border clip-cut-corner-xs',
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetRow;
