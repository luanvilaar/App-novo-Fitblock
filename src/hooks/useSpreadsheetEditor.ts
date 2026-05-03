import { useState, useRef, useCallback, useMemo } from 'react';
import { tokenizeLine } from '@/lib/workout-parser/tokenizer';
import { parseWorkoutText } from '@/lib/workout-parser/parser';
import type { Token, ParsedWorkout } from '@/lib/workout-parser/types';

// Re-export legacy adapter for consumers that expect old shapes
import { parseWorkoutText as legacyParse } from '@/lib/workoutParser';
import type { ParsedWorkout as LegacyParsedWorkout } from '@/lib/workoutParser';

export interface UseSpreadsheetEditorOptions {
  initialValue?: string;
  onChange?: (text: string, parsed: LegacyParsedWorkout) => void;
}

export interface SpreadsheetLine {
  content: string;
  token: Token;
}

export function useSpreadsheetEditor({ initialValue = '', onChange }: UseSpreadsheetEditorOptions) {
  const [lines, setLines] = useState<string[]>(() =>
    initialValue ? initialValue.split('\n') : ['']
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Debounced change notification
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyChange = useCallback((newLines: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const text = newLines.join('\n');
      const parsed = legacyParse(text);
      onChangeRef.current?.(text, parsed);
    }, 150);
  }, []);

  // Tokenize each line (memoized per lines content)
  const tokenizedLines: SpreadsheetLine[] = useMemo(() =>
    lines.map((content, idx) => ({
      content,
      token: tokenizeLine(content, idx + 1),
    })),
    [lines]
  );

  // Full parsed workout (new types)
  const parsedWorkout: ParsedWorkout = useMemo(() =>
    parseWorkoutText(lines.join('\n')),
    [lines]
  );

  // ── Line operations ───────────────────────────────────────────

  const updateLines = useCallback((newLines: string[]) => {
    setLines(newLines);
    notifyChange(newLines);
  }, [notifyChange]);

  const updateLine = useCallback((index: number, value: string) => {
    setLines(prev => {
      const next = [...prev];
      next[index] = value;
      notifyChange(next);
      return next;
    });
  }, [notifyChange]);

  const insertLineAfter = useCallback((index: number, content = '') => {
    setLines(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, content);
      notifyChange(next);
      return next;
    });
    setTimeout(() => {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }, 0);
  }, [notifyChange]);

  const removeLine = useCallback((index: number) => {
    setLines(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      const newFocus = Math.max(0, index - 1);
      notifyChange(next);
      setTimeout(() => {
        setFocusedIndex(newFocus);
        inputRefs.current[newFocus]?.focus();
      }, 0);
      return next;
    });
  }, [notifyChange]);

  // ── Keyboard handler ──────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        insertLineAfter(index);
        break;

      case 'Backspace':
        if (lines[index] === '' && lines.length > 1) {
          e.preventDefault();
          removeLine(index);
        }
        break;

      case 'ArrowDown':
        if (index < lines.length - 1) {
          e.preventDefault();
          setFocusedIndex(index + 1);
          inputRefs.current[index + 1]?.focus();
        }
        break;

      case 'ArrowUp':
        if (index > 0) {
          e.preventDefault();
          setFocusedIndex(index - 1);
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case 'Tab':
        if (index === lines.length - 1) {
          e.preventDefault();
          insertLineAfter(index);
        }
        break;
    }
  }, [lines, insertLineAfter, removeLine]);

  // ── Paste handler ─────────────────────────────────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedLines = pastedText.split(/\r?\n/);

    setLines(prev => {
      const next = [...prev];
      // Replace current line with first pasted line appended to current content before cursor
      // Then insert remaining lines after
      const currentLine = next[index] || '';
      const input = inputRefs.current[index];
      const cursorPos = input?.selectionStart ?? currentLine.length;

      const before = currentLine.slice(0, cursorPos);
      const after = currentLine.slice(cursorPos);

      const merged = [
        before + pastedLines[0],
        ...pastedLines.slice(1, -1),
        (pastedLines.length > 1 ? pastedLines[pastedLines.length - 1] : '') + after,
      ].filter((_, i) => i === 0 || pastedLines.length > 1 || i > 0);

      // If only one pasted line, just replace current
      if (pastedLines.length === 1) {
        next[index] = before + pastedLines[0] + after;
      } else {
        next.splice(index, 1, ...merged);
      }

      const lastPastedIdx = index + Math.max(0, pastedLines.length - 1);
      setTimeout(() => {
        setFocusedIndex(lastPastedIdx);
        inputRefs.current[lastPastedIdx]?.focus();
      }, 0);

      notifyChange(next);
      return next;
    });
  }, [notifyChange]);

  // ── Focus on empty area ───────────────────────────────────────

  const focusLastLine = useCallback(() => {
    const lastIdx = lines.length - 1;
    setFocusedIndex(lastIdx);
    inputRefs.current[lastIdx]?.focus();
  }, [lines.length]);

  return {
    lines,
    tokenizedLines,
    parsedWorkout,
    focusedIndex,
    inputRefs,
    setFocusedIndex,
    updateLine,
    handleKeyDown,
    handlePaste,
    focusLastLine,
  };
}
