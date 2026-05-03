import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookMarked, Dumbbell, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import NewExerciseDialog, { type NewExerciseFormValues } from "@/components/trainer/NewExerciseDialog";
import VideoPreview from "@/components/VideoPreview";
import type { Tables } from "@/integrations/supabase/types";

type ExerciseRow = Tables<"exercises">;

const TrainerExerciseLibrary = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const initialValues = useMemo((): Partial<NewExerciseFormValues> | null => {
    if (!editing) {
      return null;
    }
    return {
      name: editing.name,
      category: editing.category,
      video_url: editing.video_url ?? "",
      param1_type: editing.param1_type ?? "",
      param2_type: editing.param2_type ?? "",
      param3_type: editing.param3_type ?? "",
    };
  }, [editing]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: ExerciseRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleSave = async (data: NewExerciseFormValues) => {
    if (!data.name.trim()) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: data.name.trim(),
        category: data.category || "geral",
        video_url: data.video_url.trim() || null,
        param1_type: data.param1_type || null,
        param2_type: data.param2_type || null,
        param3_type: data.param3_type || null,
      };
      if (editing) {
        const { error } = await supabase.from("exercises").update(payload).eq("id", editing.id);
        if (error) {
          throw error;
        }
        toast.success("Movimento atualizado");
      } else {
        const { error } = await supabase.from("exercises").insert(payload);
        if (error) {
          throw error;
        }
        toast.success("Movimento criado");
      }
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 pt-6">
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">Catálogo global</p>
          <h1 className="font-display text-5xl font-normal tracking-[-0.06em] text-foreground md:text-[4rem]">Biblioteca de movimentos</h1>
          <p className="max-w-xl font-body text-sm text-muted-foreground">
            Cadastre nomes canónicos e vídeos. O texto para treino (parser e conversão) tenta alinhar frases como “back squat costas” ao movimento
            “back squat” desta lista.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-6 font-mono text-[10px] uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary hover:text-white sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo movimento
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou categoria…"
          className="h-12 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/65 focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-border/80 bg-card text-foreground/40">
          <Dumbbell className="h-10 w-10 animate-pulse" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border/80">
            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center font-body text-sm text-muted-foreground">
                {rows.length === 0
                  ? "Ainda não há movimentos. Adicione o primeiro com o botão acima."
                  : "Nenhum resultado para esta pesquisa."}
              </div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground">{r.name}</p>
                      <span className="rounded-md border border-primary/10 bg-primary/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary/70">
                        {r.category}
                      </span>
                    </div>
                    {r.video_url ? (
                      <div className="mt-3 max-w-md">
                        <VideoPreview url={r.video_url} />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-foreground/30">Sem vídeo</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary sm:self-center"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p className="font-body text-xs text-muted-foreground/80">
        <BookMarked className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
        O catálogo é partilhado entre treinadores. Nomes consistentes melhoram o match automático a partir do texto livre.
      </p>

      <NewExerciseDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
          }
          setDialogOpen(o);
        }}
        onSave={handleSave}
        saving={saving}
        initialValues={editing ? initialValues : null}
        title={editing ? "Editar movimento" : "Novo movimento"}
        submitLabel={editing ? "Guardar alterações" : "Criar movimento"}
      />
    </div>
  );
};

export default TrainerExerciseLibrary;
