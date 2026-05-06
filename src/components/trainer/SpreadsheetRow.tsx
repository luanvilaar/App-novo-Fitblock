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
  BLOCK_HEADER: { label: "BLOCO", className: "border-primary/25 bg-primary/10 text-primary" },
  EXERCISE: { label: "EXERCÍCIO", className: "border-border bg-card text-foreground" },
  EXERCISE_BISET: { label: "BI-SET", className: "border-primary/25 bg-primary/10 text-primary" },
  EXERCISE_COMBINED: { label: "COMBINADO", className: "border-border bg-background text-muted-foreground" },
  FORMAT_INDICATOR: { label: "FORMATO", className: "border-border bg-background text-foreground" },
  PRESCRIPTION: { label: "DADOS", className: "border-border bg-background text-muted-foreground" },
  SEPARATOR: { label: "NOTA", className: "border-border bg-background text-muted-foreground" },
  TEXT: { label: "TEXTO", className: "border-[hsl(var(--timeline-thinking))]/35 bg-[hsl(var(--timeline-thinking))]/15 text-foreground" },
  EMPTY: null,
};

const TOKEN_INPUT_CLASS: Record<TokenType, string> = {
  BLOCK_HEADER: "font-display text-base tracking-[-0.02em] text-primary sm:text-lg",
  EXERCISE: "font-mono text-sm text-foreground",
  EXERCISE_BISET: "font-mono text-sm text-primary",
  EXERCISE_COMBINED: "font-mono text-sm text-foreground",
  FORMAT_INDICATOR: "font-mono text-xs uppercase tracking-[0.18em] text-foreground",
  PRESCRIPTION: "font-mono text-xs italic text-muted-foreground",
  SEPARATOR: "font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
  TEXT: "font-mono text-sm text-muted-foreground",
  EMPTY: "",
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
        "group relative flex items-stretch border-b border-border transition-colors",
        isFocused
          ? "bg-primary/5 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-primary"
          : "hover:bg-background/70"
      )}
    >
      <div className="flex w-10 shrink-0 select-none items-center justify-center border-r border-border bg-background text-[10px] font-mono text-muted-foreground sm:w-14">
        {lineNumber.toString().padStart(2, "0")}
      </div>

      <input
        ref={inputRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onPaste={onPaste}
        className={cn(
          "min-w-0 flex-1 border-none bg-transparent px-4 py-3 text-sm tracking-wide outline-none transition-all placeholder:text-muted-foreground/45 focus:ring-0",
          TOKEN_INPUT_CLASS[tokenType]
        )}
        placeholder={isFirst ? "Ex.: Força / Back Squat / 5x5 @ 75%" : ""}
        spellCheck={false}
        autoComplete="off"
      />

      <div className="flex w-24 shrink-0 items-center justify-center border-l border-border bg-background sm:w-28">
        {badge && content.trim() && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em]",
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
