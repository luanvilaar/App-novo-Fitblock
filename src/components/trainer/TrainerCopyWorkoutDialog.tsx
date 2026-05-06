import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { StudentCombobox } from "@/components/StudentCombobox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TrainerWeekWorkout } from "@/hooks/useTrainerWeekWorkouts";
import { copyTrainerWorkoutToTarget, duplicateTrainerWorkout } from "@/lib/trainer-workout-actions";
import { cn } from "@/lib/utils";

type DestKind = "student" | "group";

export function TrainerCopyWorkoutDialog({
  open,
  onOpenChange,
  sourceWorkout,
  trainerId,
  students,
  groups,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWorkout: TrainerWeekWorkout | null;
  trainerId: string | null;
  students: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const [targetDate, setTargetDate] = useState("");
  const [destKind, setDestKind] = useState<DestKind>("student");
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !sourceWorkout) return;
    setTargetDate(sourceWorkout.date);
    setDestKind("student");
    setStudentId("");
    setGroupId("");
  }, [open, sourceWorkout?.id, groups.length]);

  const hasGroups = groups.length > 0;
  const effectiveKind: DestKind = hasGroups ? destKind : "student";

  const handleDuplicateHere = async () => {
    if (!trainerId || !sourceWorkout) {
      toast.error("Dados em falta.");
      return;
    }
    setBusy(true);
    try {
      await duplicateTrainerWorkout(sourceWorkout.id, trainerId);
      toast.success("Treino duplicado neste perfil (data de hoje).");
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao duplicar.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyToTarget = async () => {
    if (!trainerId || !sourceWorkout || !targetDate) {
      toast.error("Selecione a data e o destino.");
      return;
    }
    if (effectiveKind === "student" && !studentId) {
      toast.error("Selecione o atleta de destino.");
      return;
    }
    if (effectiveKind === "group" && !groupId) {
      toast.error("Selecione o grupo de destino.");
      return;
    }

    setBusy(true);
    try {
      if (effectiveKind === "student") {
        await copyTrainerWorkoutToTarget(sourceWorkout.id, trainerId, {
          type: "student",
          studentId,
          date: targetDate,
        });
      } else {
        await copyTrainerWorkoutToTarget(sourceWorkout.id, trainerId, {
          type: "group",
          groupId,
          date: targetDate,
        });
      }
      toast.success("Treino copiado para o destino escolhido.");
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao copiar treino.");
    } finally {
      setBusy(false);
    }
  };

  if (!sourceWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[28px] border border-border bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl font-medium tracking-[-0.04em] text-foreground">Copiar treino</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <span className="font-medium text-foreground">{sourceWorkout.title}</span>
            <span className="text-muted-foreground"> · </span>
            Prescrição, exercícios e metcons serão copiados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-full border-border bg-background text-foreground hover:border-primary/30 hover:text-primary"
            disabled={busy || !trainerId}
            onClick={() => void handleDuplicateHere()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : null}
            Duplicar neste perfil (data de hoje)
          </Button>

          <div className="relative">
            <Separator className="bg-border" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              ou enviar para
            </span>
          </div>

          {hasGroups ? (
            <RadioGroup
              value={destKind}
              onValueChange={(v) => setDestKind(v as DestKind)}
              className="grid gap-3"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <RadioGroupItem value="student" id="dest-student" />
                <Label htmlFor="dest-student" className="cursor-pointer text-sm font-medium text-foreground">
                  Outro atleta
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <RadioGroupItem value="group" id="dest-group" />
                <Label htmlFor="dest-group" className="cursor-pointer text-sm font-medium text-foreground">
                  Grupo
                </Label>
              </div>
            </RadioGroup>
          ) : null}

          {effectiveKind === "student" ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Atleta de destino
              </Label>
              <StudentCombobox students={students} value={studentId} onChange={setStudentId} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Grupo de destino
              </Label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={cn(
                  "h-12 w-full rounded-2xl border border-border bg-background px-4 font-body text-sm text-foreground",
                  "focus:border-primary focus:outline-none",
                )}
              >
                <option value="">Selecionar grupo…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="copy-date" className="text-xs font-medium text-muted-foreground">
              Data do treino no destino
            </Label>
            <input
              id="copy-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <p className="font-body text-[11px] leading-snug text-muted-foreground">
              Por defeito usa a mesma data do treino original. Pode alterar antes de criar a cópia.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full bg-primary text-primary-foreground hover:opacity-90"
            disabled={
              busy ||
              !trainerId ||
              (effectiveKind === "student" && !studentId) ||
              (effectiveKind === "group" && !groupId) ||
              !targetDate
            }
            onClick={() => void handleCopyToTarget()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : null}
            Criar cópia no destino
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
