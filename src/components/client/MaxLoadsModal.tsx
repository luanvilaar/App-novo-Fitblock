import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, Save, Loader2, Search, TrendingUp } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface MaxLoad {
  id?: string;
  exercise_id: string;
  max_load: number;
  unit: string;
  notes?: string;
}

interface MaxLoadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSaved?: () => void;
}

const MaxLoadsModal = ({ open, onOpenChange, studentId, onSaved }: MaxLoadsModalProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [maxLoads, setMaxLoads] = useState<Record<string, MaxLoad>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !studentId) return;
    
    const load = async () => {
      setLoading(true);
      
      const [{ data: exs }, { data: loads }] = await Promise.all([
        supabase.from("exercises").select("id, name, category").order("name"),
        supabase.from("student_max_loads").select("*").eq("student_id", studentId)
      ]);
      
      if (exs) setExercises(exs);
      
      if (loads) {
        const loadsMap: Record<string, MaxLoad> = {};
        loads.forEach(l => {
          loadsMap[l.exercise_id] = {
            id: l.id,
            exercise_id: l.exercise_id,
            max_load: Number(l.max_load),
            unit: l.unit || "kg",
            notes: l.notes || ""
          };
        });
        setMaxLoads(loadsMap);
      }
      
      setLoading(false);
    };
    
    load();
  }, [open, studentId]);

  const updateMaxLoad = (exerciseId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== "") return;
    
    setMaxLoads(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        exercise_id: exerciseId,
        max_load: numValue || 0,
        unit: prev[exerciseId]?.unit || "kg"
      }
    }));
  };

  const saveMaxLoads = async () => {
    if (!studentId) {
      toast.error("Atleta não identificado");
      return;
    }

    setSaving(true);
    
    try {
      // Filtrar apenas as cargas que foram carregadas ou modificadas
      const allLoads = Object.values(maxLoads);
      
      if (allLoads.length === 0) {
        toast.info("Nenhuma alteração para salvar");
        setSaving(false);
        return;
      }
      
      const rows = allLoads.map(ml => {
        const row: any = {
          student_id: studentId,
          exercise_id: ml.exercise_id,
          max_load: ml.max_load,
          unit: ml.unit,
          notes: ml.notes || null,
          updated_at: new Date().toISOString()
        };
        
        // Se já existe um ID, incluímos para garantir o update correto
        if (ml.id) row.id = ml.id;
        
        return row;
      });
      
      const { error } = await supabase.from("student_max_loads").upsert(rows, {
        onConflict: "student_id,exercise_id",
      });

      if (error) {
        console.error("Supabase upsert error detail:", error);
        const msg = error.message || "";
        if (
          msg.includes("student_max_loads") &&
          (msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("Could not find"))
        ) {
          toast.error(
            "O Supabase desta app não expõe student_max_loads (projeto errado ou cache da API). Confirme que VITE_SUPABASE_URL é o mesmo project_ref que `supabase link`; rode `npm run supabase:sync` na raiz do repo ou NOTIFY pgrst reload no SQL Editor.",
            { duration: 14_000 },
          );
          throw error;
        }
        throw error;
      }
      
      toast.success("Cargas salvas com sucesso!");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving max loads:", err);
      toast.error(err.message || "Erro ao salvar cargas");
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  );

  const exercisesWithLoads = filteredExercises.filter(ex => maxLoads[ex.id]?.max_load > 0);
  const exercisesWithoutLoads = filteredExercises.filter(ex => !maxLoads[ex.id] || maxLoads[ex.id].max_load === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <div className="w-8 h-8 clip-cut-corner-sm bg-energy/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-energy" />
            </div>
            Minhas Cargas Máximas (1RM)
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="pl-9 h-10 rounded-lg bg-secondary border-border"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-energy" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {exercisesWithLoads.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-energy uppercase tracking-wide mb-2">
                  Com carga registrada ({exercisesWithLoads.length})
                </p>
                <div className="space-y-2">
                  {exercisesWithLoads.map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-energy/5 border border-energy/20"
                    >
                      <Dumbbell className="w-4 h-4 text-energy shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ex.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={maxLoads[ex.id]?.max_load || ""}
                          onChange={(e) => updateMaxLoad(ex.id, e.target.value)}
                          className="w-20 h-8 text-center text-sm font-bold bg-background border-border"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground font-mono">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exercisesWithoutLoads.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Sem carga ({exercisesWithoutLoads.length})
                </p>
                <div className="space-y-1.5">
                  {exercisesWithoutLoads.map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <Dumbbell className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ex.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={maxLoads[ex.id]?.max_load || ""}
                          onChange={(e) => updateMaxLoad(ex.id, e.target.value)}
                          className="w-20 h-8 text-center text-sm bg-background border-border"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground font-mono">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-border mt-auto">
          <Button
            onClick={saveMaxLoads}
            disabled={saving}
            className="w-full clip-cut-corner"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Cargas
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaxLoadsModal;
