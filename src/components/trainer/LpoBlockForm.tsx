import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Percent, Weight, PenLine } from "lucide-react";

export interface LpoSeries {
  id: string;
  reps: string;
  load: string;
}

export interface LpoExercise {
  id: string;
  movement: string;
  notes: string;
  loadType: "percent" | "kg" | "free";
  series: LpoSeries[];
}

const createEmptySeries = (): LpoSeries => ({
  id: crypto.randomUUID(),
  reps: "",
  load: "",
});

const createEmptyLpo = (): LpoExercise => ({
  id: crypto.randomUUID(),
  movement: "",
  notes: "",
  loadType: "percent",
  series: Array.from({ length: 5 }, createEmptySeries),
});

/**
 * Serialize LPO exercises into text for storage in metcon_description.
 * Prefixed with [LPO_STRUCTURED] marker for parsing back.
 */
export const serializeLpoExercises = (exercises: LpoExercise[]): string => {
  return `[LPO_STRUCTURED]\n${JSON.stringify(exercises)}`;
};

/** Remove BOM / zero-width que impedem startsWith("[LPO_STRUCTURED]") */
function stripLeadingNoise(s: string): string {
  return s.replace(/^\uFEFF/, "").replace(/^[\u200B\u200C\u200D\uFEFF]+/, "").trim();
}

function tryParseJsonPayload(payload: string): unknown {
  const trimmed = payload.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Vírgulas finais comuns em cópias manuais
    try {
      return JSON.parse(trimmed.replace(/,\s*([\]}])/g, "$1"));
    } catch {
      /* continua */
    }
  }
  // JSON embutido: primeiro [...] ou {...}
  const iArr = trimmed.indexOf("[");
  const iObj = trimmed.indexOf("{");
  if (iArr === -1 && iObj === -1) throw new Error("no json");
  const start =
    iArr === -1 ? iObj : iObj === -1 ? iArr : Math.min(iArr, iObj);
  const lastArr = trimmed.lastIndexOf("]");
  const lastObj = trimmed.lastIndexOf("}");
  const end = Math.max(lastArr, lastObj);
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("no json slice");
}

function normalizeLpoExercise(ex: Record<string, unknown>): LpoExercise {
  const id = typeof ex.id === "string" && ex.id ? ex.id : crypto.randomUUID();
  const movement = String(ex.movement ?? "");
  const notes = String(ex.notes ?? "");
  const lt = ex.loadType;
  const loadType: LpoExercise["loadType"] =
    lt === "kg" ? "kg" : lt === "free" ? "free" : "percent";

  if (Array.isArray(ex.series) && ex.series.length > 0) {
    return {
      id,
      movement,
      notes,
      loadType,
      series: ex.series.map((s: unknown, i: number) => {
        const row = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
        return {
          id: typeof row.id === "string" && row.id ? row.id : `s-${i}-${id.slice(0, 8)}`,
          reps: String(row.reps ?? ""),
          load: String(row.load ?? ""),
        };
      }),
    };
  }

  const sets = Math.max(1, Number(ex.sets) || 5);
  return {
    id,
    movement,
    notes,
    loadType,
    series: Array.from({ length: sets }, (_, i) => ({
      id: `s-${i}-${id.slice(0, 8)}`,
      reps: String(ex.reps ?? ""),
      load: String(ex.loadValue ?? ""),
    })),
  };
}

/**
 * Parse metcon_description back into LPO exercises.
 * Supports both old format (sets/reps/loadValue) and new format (series[]).
 */
export const parseLpoExercises = (description: string): LpoExercise[] | null => {
  const raw = stripLeadingNoise(description ?? "");
  if (!/^\[LPO_STRUCTURED\]/i.test(raw)) return null;

  const afterMarker = raw.replace(/^\[LPO_STRUCTURED\]\s*/i, "").trim();
  if (!afterMarker) return null;

  let data: unknown;
  try {
    data = tryParseJsonPayload(afterMarker);
  } catch {
    return null;
  }

  const list: Record<string, unknown>[] = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : data && typeof data === "object"
      ? [data as Record<string, unknown>]
      : [];

  if (list.length === 0) return null;

  return list.map((ex) => normalizeLpoExercise(ex));
};

/** Para UI: saber se devemos tentar LPO mesmo quando parse falhou */
export const hasLpoStructuredMarker = (description: string | null | undefined): boolean =>
  /^\[LPO_STRUCTURED\]/i.test(stripLeadingNoise(description ?? ""));

interface LpoBlockFormProps {
  exercises: LpoExercise[];
  onChange: (exercises: LpoExercise[]) => void;
}

const LpoBlockForm = ({ exercises, onChange }: LpoBlockFormProps) => {
  const addExercise = () => onChange([...exercises, createEmptyLpo()]);

  const removeExercise = (id: string) =>
    onChange(exercises.filter((e) => e.id !== id));

  const updateField = (id: string, field: keyof LpoExercise, value: any) =>
    onChange(exercises.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const updateSeries = (exId: string, seriesId: string, field: keyof LpoSeries, value: string) =>
    onChange(
      exercises.map((e) =>
        e.id === exId
          ? { ...e, series: e.series.map((s) => (s.id === seriesId ? { ...s, [field]: value } : s)) }
          : e
      )
    );

  const addSeries = (exId: string) =>
    onChange(
      exercises.map((e) =>
        e.id === exId ? { ...e, series: [...e.series, createEmptySeries()] } : e
      )
    );

  const removeSeries = (exId: string, seriesId: string) =>
    onChange(
      exercises.map((e) =>
        e.id === exId ? { ...e, series: e.series.filter((s) => s.id !== seriesId) } : e
      )
    );

  return (
    <div className="space-y-3">
      {exercises.map((ex, idx) => (
        <div
          key={ex.id}
          className="relative rounded-xl border border-border bg-background p-3 space-y-3"
        >
          {exercises.length > 1 && (
            <button
              onClick={() => removeExercise(ex.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black">
              {idx + 1}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Exercício LPO
            </span>
          </div>

          {/* Movement */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Movimento / Complexo</span>
            <textarea
              value={ex.movement}
              onChange={(e) => updateField(ex.id, "movement", e.target.value)}
              placeholder={"Ex: Complex Clean\n1 Power Clean\n1 Clean and Jerk"}
              rows={3}
              className="w-full min-h-[60px] rounded-lg bg-secondary border border-border text-sm font-semibold p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background placeholder:text-muted-foreground"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <PenLine className="w-3 h-3" /> Observações / Instruções
            </span>
            <textarea
              value={ex.notes}
              onChange={(e) => updateField(ex.id, "notes", e.target.value)}
              placeholder="Ex: Usa sua máxima de power clean. Faça um power clean e solte a barra..."
              rows={2}
              className="w-full min-h-[48px] rounded-lg bg-secondary border border-border text-xs p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background placeholder:text-muted-foreground"
            />
          </div>

          {/* Load Type Toggle */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Tipo de Carga</span>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: "percent", icon: <Percent className="w-3.5 h-3.5" />, label: "Percentual (%)" },
                { key: "kg", icon: <Weight className="w-3.5 h-3.5" />, label: "Carga fixa (kg)" },
                { key: "free", icon: null, label: "Livre" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => updateField(ex.id, "loadType", opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    ex.loadType === opt.key
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Series Table */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Séries</span>
            <div className="rounded-lg border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_32px] bg-secondary/60 text-[10px] font-bold text-muted-foreground uppercase px-2 py-1.5">
                <span>#</span>
                <span>Reps</span>
                <span>{ex.loadType === "percent" ? "%" : ex.loadType === "kg" ? "Carga (kg)" : "Carga"}</span>
                <span></span>
              </div>
              {/* Rows */}
              {ex.series.map((s, sIdx) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[40px_1fr_1fr_32px] items-center px-2 py-1 border-t border-border/50"
                >
                  <span className="text-[11px] font-bold text-muted-foreground">{sIdx + 1}</span>
                  <Input
                    value={s.reps}
                    onChange={(e) => updateSeries(ex.id, s.id, "reps", e.target.value)}
                    placeholder="2"
                    className="h-8 rounded bg-transparent border-0 text-xs font-bold text-center p-1 focus-visible:ring-1"
                  />
                  {ex.loadType === "free" ? (
                    <span className="text-[10px] text-muted-foreground italic text-center">atleta</span>
                  ) : (
                    <div className="relative">
                      <Input
                        value={s.load}
                        onChange={(e) => updateSeries(ex.id, s.id, "load", e.target.value)}
                        placeholder={ex.loadType === "percent" ? "55" : "60"}
                        className="h-8 rounded bg-transparent border-0 text-xs font-bold text-center p-1 pr-6 focus-visible:ring-1"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                        {ex.loadType === "percent" ? "%" : "kg"}
                      </span>
                    </div>
                  )}
                  {ex.series.length > 1 ? (
                    <button
                      onClick={() => removeSeries(ex.id, s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addSeries(ex.id)}
              className="h-7 text-[10px] text-primary hover:bg-primary/10 gap-1 px-2"
            >
              <Plus className="w-3 h-3" /> Série
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addExercise}
        className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Adicionar outro exercício LPO
      </Button>
    </div>
  );
};

export default LpoBlockForm;
export { createEmptyLpo };
