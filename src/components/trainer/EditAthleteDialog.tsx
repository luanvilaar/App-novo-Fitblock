import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BoxOption {
  id: string;
  name: string;
  slug: string;
}

interface EditAthleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; user_id: string; name: string; email: string } | null;
  onSaved: () => void;
}

const EditAthleteDialog = ({ open, onOpenChange, student, onSaved }: EditAthleteDialogProps) => {
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase.from("boxes").select("id, name, slug").order("name");
      if (data) setBoxes(data);

      if (student) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("box_id")
          .eq("user_id", student.user_id)
          .maybeSingle();
        setSelectedBoxId(profile?.box_id || "");
      }
    };
    load();
  }, [open, student]);

  const handleSave = async () => {
    if (!student || !selectedBoxId) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ box_id: selectedBoxId })
        .eq("user_id", student.user_id);
      if (profileErr) throw profileErr;

      const { error: studentErr } = await supabase
        .from("students")
        .update({ box_id: selectedBoxId })
        .eq("id", student.id);
      if (studentErr) throw studentErr;

      toast.success(`${student.name || student.email} movido para nova box`);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar box do atleta");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 clip-cut-corner-lg p-10 backdrop-blur-xl">
        <DialogHeader className="space-y-2 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary font-bold">NODE_RECONFIGURATION_V.01</div>
          <DialogTitle className="font-display text-4xl uppercase tracking-tighter text-white">Editar Atleta</DialogTitle>
          <div className="h-0.5 w-12 bg-primary" />
        </DialogHeader>
        
        <div className="space-y-8 mt-4">
          <div className="p-5 bg-white/[0.03] border border-white/5 clip-cut-corner-sm">
            <p className="font-display text-xl uppercase tracking-tight text-white mb-1">{student?.name || "UNNAMED_NODE"}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60">{student?.email}</p>
          </div>

          <div className="space-y-3">
            <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground ml-1">Atribuição_de_Box</Label>
            <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
              <SelectTrigger className="h-14 border-white/10 bg-white/5 focus:ring-1 focus:ring-primary text-white font-mono text-xs tracking-widest uppercase rounded-none">
                <SelectValue placeholder="SELECIONAR DESTINO" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white font-mono text-xs uppercase tracking-widest">
                {boxes.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="hover:bg-primary/20 focus:bg-primary/20 cursor-pointer">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <button 
              className="w-full h-14 bg-primary text-white font-display font-bold uppercase tracking-widest text-xs clip-cut-corner-sm hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(65,31,128,0.2)] disabled:opacity-50 disabled:grayscale" 
              onClick={handleSave} 
              disabled={saving || !selectedBoxId}
            >
              {saving ? "PROCESSANDO..." : "SALVAR CONFIGURAÇÕES"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAthleteDialog;
