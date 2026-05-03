import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="rounded-[28px] border border-border bg-card p-8">
        <DialogHeader className="mb-8 space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Atleta</div>
          <DialogTitle className="text-3xl font-medium tracking-[-0.04em] text-foreground">Editar atleta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 mt-4">
          <div className="rounded-[24px] border border-border bg-background p-5">
            <p className="mb-1 text-2xl font-medium tracking-[-0.03em] text-foreground">{student?.name || "Atleta"}</p>
            <p className="text-sm text-muted-foreground">{student?.email}</p>
          </div>

          <div className="space-y-3">
            <Label className="ml-1 text-xs font-medium text-muted-foreground">Vincular box</Label>
            <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
              <SelectTrigger className="h-12 rounded-2xl border-border bg-background text-foreground focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Selecionar destino" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                {boxes.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="cursor-pointer focus:bg-primary/10">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <button
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              onClick={handleSave} 
              disabled={saving || !selectedBoxId}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAthleteDialog;
