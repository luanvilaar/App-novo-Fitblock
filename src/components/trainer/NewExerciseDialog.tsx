import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoPreview from "@/components/VideoPreview";
import { Dumbbell, X, Link2, Tag } from "lucide-react";

const EXERCISE_CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "força", label: "Força" },
  { value: "cardio", label: "Cardio" },
  { value: "ginástico", label: "Ginástico" },
  { value: "lpo", label: "LPO" },
  { value: "acessório", label: "Acessório" },
  { value: "mobilidade", label: "Mobilidade" },
];

const PARAM_TYPES = [
  { value: "", label: "Nenhum" },
  { value: "reps", label: "Reps" },
  { value: "weight_kg", label: "Weight (kg)" },
  { value: "weight_lb", label: "Weight (lb)" },
  { value: "weight_percent", label: "Weight (%)" },
  { value: "distance_m", label: "Distance (meters)" },
  { value: "distance_ft", label: "Distance (ft)" },
  { value: "distance_yd", label: "Distance (yd)" },
  { value: "distance_miles", label: "Distance (miles)" },
  { value: "distance_inches", label: "Distance (inches)" },
  { value: "height_cm", label: "Height (cm)" },
  { value: "height_inches", label: "Height (inches)" },
  { value: "time_sec", label: "Time (seconds)" },
  { value: "time_min", label: "Time (minutes)" },
  { value: "calories", label: "Calories" },
  { value: "rpm", label: "RPM" },
];

export interface NewExerciseFormValues {
  name: string;
  category: string;
  video_url: string;
  param1_type: string;
  param2_type: string;
  param3_type: string;
}

interface NewExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: NewExerciseFormValues) => Promise<void>;
  saving: boolean;
  /** Pré-preenche ao abrir (ex.: edição na biblioteca). */
  initialValues?: Partial<NewExerciseFormValues> | null;
  title?: string;
  submitLabel?: string;
}

const NewExerciseDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
  initialValues,
  title = "Novo Movimento",
  submitLabel,
}: NewExerciseDialogProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("geral");
  const [videoUrl, setVideoUrl] = useState("");
  const [param1, setParam1] = useState("");
  const [param2, setParam2] = useState("");
  const [param3, setParam3] = useState("");

  const resetForm = () => {
    setName("");
    setCategory("geral");
    setVideoUrl("");
    setParam1("");
    setParam2("");
    setParam3("");
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    if (initialValues && Object.keys(initialValues).length > 0) {
      setName(initialValues.name ?? "");
      setCategory(initialValues.category ?? "geral");
      setVideoUrl(initialValues.video_url ?? "");
      setParam1(initialValues.param1_type ?? "");
      setParam2(initialValues.param2_type ?? "");
      setParam3(initialValues.param3_type ?? "");
    } else {
      resetForm();
    }
  }, [open, initialValues]);

  const handleClose = (v: boolean) => {
    if (!v) {
      resetForm();
    }
    onOpenChange(v);
  };

  const handleSave = async () => {
    await onSave({
      name: name.trim(),
      category,
      video_url: videoUrl.trim(),
      param1_type: param1,
      param2_type: param2,
      param3_type: param3,
    });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-medium">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Nome do exercício *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dumbbell Bulgarian Split Squat"
              className="h-12 rounded-xl bg-secondary border-border font-medium"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && name.trim() && handleSave()}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Categoria
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    category === cat.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Section */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Parâmetros de treino
            </Label>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Configure até 3 métricas padrão para este exercício.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Parâmetro 1", value: param1, onChange: setParam1 },
                { label: "Parâmetro 2", value: param2, onChange: setParam2 },
                { label: "Parâmetro 3", value: param3, onChange: setParam3 },
              ].map((param, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-24 shrink-0">
                    {param.label}
                  </span>
                  <Select value={param.value} onValueChange={param.onChange}>
                    <SelectTrigger className="h-10 rounded-lg bg-secondary border-border text-sm flex-1">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PARAM_TYPES.map((pt) => (
                        <SelectItem key={pt.value || "__none"} value={pt.value || "__none"}>
                          {pt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {param.value && (
                    <button
                      type="button"
                      onClick={() => param.onChange("")}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Link2 className="w-3 h-3" /> Link de vídeo demonstrativo
            </Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              className="h-10 rounded-lg bg-secondary border-border text-sm"
            />
            {videoUrl.trim() && (
              <div className="mt-2">
                <VideoPreview url={videoUrl.trim()} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? "Salvando..." : submitLabel ?? "Criar Movimento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewExerciseDialog;
