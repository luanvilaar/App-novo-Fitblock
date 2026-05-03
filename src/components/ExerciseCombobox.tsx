import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

export interface ExerciseComboboxRef {
  focus: () => void;
}

interface ExerciseComboboxProps {
  exercises: Exercise[];
  value: string;
  onChange: (exerciseId: string) => void;
  onNewExercise: () => void;
  autoFocus?: boolean;
  /** Quando não há exercício selecionado, mostrar este texto (ex.: nome vindo do modo inteligente) */
  labelWhenEmpty?: string;
}

const ExerciseCombobox = forwardRef<ExerciseComboboxRef, ExerciseComboboxProps>(
  ({ exercises, value, onChange, onNewExercise, autoFocus, labelWhenEmpty }, ref) => {
  const [open, setOpen] = useState(autoFocus || false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }));

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  const selectedExercise = exercises.find((e) => e.id === value);

  const filtered = search.trim()
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {open ? (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="h-10 rounded-lg bg-background border-border text-sm pl-7"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setSearch("");
              }
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex-1 w-full h-10 rounded-lg bg-background border border-border px-2 text-sm text-foreground text-left truncate hover:border-primary/50 transition-colors"
        >
          {selectedExercise?.name || (labelWhenEmpty?.trim() ? labelWhenEmpty.trim() : "Selecionar exercício")}
        </button>
      )}

      {open && (search.trim().length > 0 || true) && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {search.trim().length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground text-center">
              Digite para buscar...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground text-center">
              Nenhum exercício encontrado
            </div>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onChange(e.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors truncate ${
                  e.id === value ? "text-primary font-semibold bg-primary/10" : "text-foreground"
                }`}
              >
                {e.name}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              onNewExercise();
              setOpen(false);
              setSearch("");
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors border-t border-border flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar novo movimento
          </button>
        </div>
      )}
    </div>
  );
});

ExerciseCombobox.displayName = "ExerciseCombobox";

export default ExerciseCombobox;
