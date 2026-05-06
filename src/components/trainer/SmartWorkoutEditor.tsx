import React, { useEffect, useRef } from "react";
import { ParsedWorkout, parseWorkoutText } from "@/lib/workoutParser";
import { useSpreadsheetEditor } from "@/hooks/useSpreadsheetEditor";
import SpreadsheetRow from "./SpreadsheetRow";

interface SmartWorkoutEditorProps {
  initialValue?: string;
  onChange: (text: string, parsed: ParsedWorkout) => void;
}

const SmartWorkoutEditor: React.FC<SmartWorkoutEditorProps> = ({ initialValue = "", onChange }) => {
  const { lines, tokenizedLines, focusedIndex, inputRefs, setFocusedIndex, updateLine, handleKeyDown, handlePaste, focusLastLine } =
    useSpreadsheetEditor({ initialValue, onChange });

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const text = lines.join("\n");
      onChange(text, parseWorkoutText(text));
    }
  }, []);

  return (
    <div className="flex min-h-[420px] w-full flex-col overflow-hidden rounded-[28px] border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Texto livre</p>
          <h3 className="text-lg font-medium tracking-[-0.02em] text-foreground">Escreva o treino como rascunho estruturado</h3>
          <p className="text-sm text-muted-foreground">
            Use uma linha por instrução. Depois converta para o formulário para revisar cargas, reps e blocos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-background px-3 py-1 font-mono uppercase tracking-[0.18em]">Enter nova linha</span>
          <span className="rounded-full border border-border bg-background px-3 py-1 font-mono uppercase tracking-[0.18em]">Tab navegação</span>
          <span className="rounded-full border border-border bg-background px-3 py-1 font-mono uppercase tracking-[0.18em]">Ctrl+V colar</span>
        </div>
      </div>

      <div className="flex border-b border-border bg-background text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <div className="w-12 border-r border-border py-3 text-center sm:w-14">#</div>
        <div className="flex-1 px-4 py-3">Comando / conteúdo</div>
        <div className="w-24 border-l border-border py-3 text-center sm:w-28">Tipo</div>
      </div>

      <div className="min-h-[260px] flex-1 overflow-y-auto bg-card">
        {tokenizedLines.map((line, idx) => (
          <SpreadsheetRow
            key={idx}
            lineNumber={idx + 1}
            content={line.content}
            tokenType={line.token.type}
            isFocused={focusedIndex === idx}
            inputRef={(el) => {
              inputRefs.current[idx] = el;
            }}
            onChange={(value) => updateLine(idx, value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={() => setFocusedIndex(idx)}
            onPaste={(e) => handlePaste(e, idx)}
            isFirst={idx === 0}
          />
        ))}

        <div className="min-h-[96px] cursor-text transition-colors hover:bg-background/80" onClick={focusLastLine} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-muted-foreground">Rascunho ideal para colar o treino bruto e estruturar antes de salvar.</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Parser ativo
        </div>
      </div>
    </div>
  );
};

export default SmartWorkoutEditor;
