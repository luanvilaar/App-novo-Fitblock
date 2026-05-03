import React, { useEffect, useRef } from 'react';
import { ParsedWorkout, parseWorkoutText } from '@/lib/workoutParser';
import { useSpreadsheetEditor } from '@/hooks/useSpreadsheetEditor';
import SpreadsheetRow from './SpreadsheetRow';

interface SmartWorkoutEditorProps {
  initialValue?: string;
  onChange: (text: string, parsed: ParsedWorkout) => void;
}

const SmartWorkoutEditor: React.FC<SmartWorkoutEditorProps> = ({ initialValue = '', onChange }) => {
  const {
    lines,
    tokenizedLines,
    focusedIndex,
    inputRefs,
    setFocusedIndex,
    updateLine,
    handleKeyDown,
    handlePaste,
    focusLastLine,
  } = useSpreadsheetEditor({ initialValue, onChange });

  // Fire initial parse on mount
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const text = lines.join('\n');
      onChange(text, parseWorkoutText(text));
    }
  }, []);

  return (
    <div className="w-full bg-[#0d0d0d] border border-white/10 clip-cut-corner-sm overflow-hidden flex flex-col min-h-[450px] shadow-2xl relative group">
      
      {/* Header row: Industrial Grid Header */}
      <div className="flex bg-white/[0.03] border-b border-white/5 text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
        <div className="w-10 sm:w-14 text-center py-3 border-r border-white/5 bg-black/40">ID</div>
        <div className="flex-1 px-4 py-3 flex items-center gap-2">
          <div className="w-1 h-1 bg-white/50 rounded-full" />
          Protocol_Command_Input
        </div>
        <div className="w-24 sm:w-28 text-center py-3 border-l border-white/5">Token_Type</div>
      </div>

      {/* Lines Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 min-h-[300px] relative">
        {/* Subtle Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        
        {tokenizedLines.map((line, idx) => (
          <SpreadsheetRow
            key={idx}
            lineNumber={idx + 1}
            content={line.content}
            tokenType={line.token.type}
            isFocused={focusedIndex === idx}
            inputRef={(el) => { inputRefs.current[idx] = el; }}
            onChange={(value) => updateLine(idx, value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={() => setFocusedIndex(idx)}
            onPaste={(e) => handlePaste(e, idx)}
            isFirst={idx === 0}
          />
        ))}

        {/* Click area to focus last line */}
        <div
          className="flex-1 cursor-text min-h-[120px] hover:bg-white/[0.01] transition-colors"
          onClick={focusLastLine}
        />
      </div>

      {/* Industrial Status Bar */}
      <div className="p-4 bg-black border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 opacity-30">
          {[
            { key: "ENTER", action: "NEW_LINE" },
            { key: "TAB", action: "NEXT_CELL" },
            { key: "↑↓", action: "NAVIGATE" },
            { key: "CTRL+V", action: "SYNC_DATA" }
          ].map(shortcut => (
            <div key={shortcut.key} className="flex items-center gap-2">
              <span className="font-mono text-[8px] border border-white/20 px-1 py-0.5 rounded-sm">{shortcut.key}</span>
              <span className="font-mono text-[8px] tracking-widest">{shortcut.action}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 border border-white/10 clip-cut-corner-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white font-bold">UPLINK_ESTABLISHED</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">Parser: V2.5</span>
        </div>
      </div>
    </div>
  );
};

export default SmartWorkoutEditor;
