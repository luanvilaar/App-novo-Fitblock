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
    <div className="space-y-16 pb-32 pt-8 px-safe">
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">Catálogo Global</p>
          <h1 className="font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-7xl">
            Movimentos.
          </h1>
        </div>
        
        <button
          type="button"
          onClick={openCreate}
          className="h-14 rounded-full bg-black px-8 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Novo Movimento
        </button>
      </header>

      <div className="rounded-[2.5rem] border border-black/5 bg-white p-10 shadow-sm">
        <p className="max-w-2xl font-sans text-lg font-medium text-black/60 leading-relaxed">
          Cadastre nomes canônicos e vídeos técnicos. O motor de inteligência do FitBlock utiliza esta base para processar as prescrições em texto livre.
        </p>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar movimentos..."
          className="h-14 w-full rounded-full border-black/5 bg-[#f3f3f3] pl-14 pr-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2.5rem] bg-[#f3f3f3] ring-1 ring-black/5">
          <Dumbbell className="h-12 w-12 animate-pulse text-black/10" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2.5rem] border border-black/5 bg-white shadow-sm">
          <div className="divide-y divide-black/5">
            {filtered.length === 0 ? (
              <div className="px-10 py-32 text-center">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/20">
                  {rows.length === 0
                    ? "Biblioteca vazia"
                    : "Nenhum resultado"}
                </p>
              </div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-8 p-10 transition-all hover:bg-[#f3f3f3]/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-sans text-3xl font-black tracking-tighter text-black">{r.name.toLowerCase()}</h3>
                      <span className="rounded-full bg-black/5 px-4 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-black/40">
                        {r.category}
                      </span>
                    </div>
                    {r.video_url ? (
                      <div className="max-w-md overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
                        <VideoPreview url={r.video_url} />
                      </div>
                    ) : (
                      <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/20">Sem vídeo cadastrado</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="h-12 flex items-center justify-center gap-2 rounded-full bg-[#f3f3f3] px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={3} />
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 font-mono text-[9px] font-black uppercase tracking-widest text-black/20">
        <BookMarked className="h-4 w-4" />
        <span>Base de dados sincronizada globalmente entre treinadores</span>
      </div>

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
