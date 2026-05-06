import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Plus, Search, Trash2, UserCheck, UserX, Pencil, Calendar } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditAthleteDialog from "@/components/trainer/EditAthleteDialog";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  user_id: string;
  active: boolean;
  name: string;
  email: string;
}

interface PendingLinkRequest {
  id: string;
  student_id: string;
  requested_at: string | null;
  athleteName: string;
  athleteEmail: string;
}

const TrainerAthletes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PendingLinkRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [linkActionId, setLinkActionId] = useState<string | null>(null);

  const fetchStudents = useCallback(async (tid: string) => {
    const { data: rawStudents } = await supabase
      .from("students")
      .select("id, user_id, active")
      .eq("trainer_id", tid)
      .order("active", { ascending: false });

    if (!rawStudents || rawStudents.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const userIds = rawStudents.map((s) => s.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    const merged: Student[] = rawStudents.map((s) => ({
      ...s,
      name: profileMap.get(s.user_id)?.name || "",
      email: profileMap.get(s.user_id)?.email || "",
    }));

    setStudents(merged);
    setLoading(false);
  }, []);

  const fetchPendingLinks = useCallback(async (tid: string) => {
    const { data: reqs, error } = await supabase
      .from("athlete_link_requests")
      .select("id, student_id, requested_at")
      .eq("trainer_id", tid)
      .eq("status", "pending")
      .order("requested_at", { ascending: true });

    if (error) {
      console.error("fetchPendingLinks", error);
      setPendingLinks([]);
      return;
    }

    if (!reqs?.length) {
      setPendingLinks([]);
      return;
    }

    const sids = reqs.map((r) => r.student_id);
    const { data: studs } = await supabase.from("students").select("id, user_id").in("id", sids);
    const uidMap = new Map((studs || []).map((s) => [s.id, s.user_id]));
    const uids = [...new Set(Array.from(uidMap.values()))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", uids);
    const profMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setPendingLinks(
      reqs.map((r) => {
        const uid = uidMap.get(r.student_id);
        const p = uid ? profMap.get(uid) : undefined;
        return {
          id: r.id,
          student_id: r.student_id,
          requested_at: r.requested_at,
          athleteName: p?.name || "Atleta",
          athleteEmail: p?.email || "",
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!trainer) {
        setLoading(false);
        return;
      }

      setTrainerId(trainer.id);
      await Promise.all([fetchStudents(trainer.id), fetchPendingLinks(trainer.id)]);
    };

    void init();
  }, [fetchPendingLinks, fetchStudents, user]);

  useEffect(() => {
    if (!trainerId) return;

    const channel = supabase
      .channel(`trainer-atletas-link-${trainerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "athlete_link_requests",
          filter: `trainer_id=eq.${trainerId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "pending") {
            toast.info("Novo pedido de vínculo.");
            void fetchPendingLinks(trainerId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "athlete_link_requests",
          filter: `trainer_id=eq.${trainerId}`,
        },
        () => {
          void fetchPendingLinks(trainerId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingLinks, trainerId]);

  const inviteStudent = async () => {
    if (!trainerId || !addEmail.trim()) return;

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-athlete", {
        body: { email: addEmail.trim(), trainer_id: trainerId, name: addName.trim() || undefined },
      });

      if (error) throw error;

      toast.success(data?.message || "Convite enviado.");
      setAddEmail("");
      setAddName("");
      setDialogOpen(false);
      await Promise.all([fetchStudents(trainerId), fetchPendingLinks(trainerId)]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao convidar atleta";
      toast.error(message);
    }

    setAdding(false);
  };

  const resolveLinkRequest = async (requestId: string, status: "approved" | "rejected") => {
    if (!trainerId) return;

    setLinkActionId(requestId);
    const { error } = await supabase
      .from("athlete_link_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);
    setLinkActionId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(status === "approved" ? "Pedido aprovado." : "Pedido recusado.");
    await fetchPendingLinks(trainerId);
    if (status === "approved") await fetchStudents(trainerId);
  };

  const deleteStudent = async (studentId: string) => {
    setDeletingStudent(true);

    const previousStudents = [...students];
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setShowDeleteConfirm(false);
    setDeleteStudentId(null);

    try {
      const { error: deleteError } = await supabase.from("students").delete().eq("id", studentId);
      if (deleteError) throw deleteError;
      toast.success("Atleta removido com sucesso.");
    } catch (err: unknown) {
      setStudents(previousStudents);
      const message = err instanceof Error ? err.message : "Erro ao remover atleta";
      toast.error(message);
    } finally {
      setDeletingStudent(false);
    }
  };

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, students],
  );

  const activeCount = students.filter((s) => s.active).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">Coach</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-black">Atletas</h1>
          <p className="mt-2 text-sm text-black/58">Gestão direta dos alunos vinculados.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-full bg-black px-5 text-sm text-white hover:bg-black/90">
              <Plus className="h-4 w-4" />
              Convidar atleta
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-black/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Convidar atleta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="joao@exemplo.com"
                  className="h-11"
                />
              </div>
              <Button className="h-11 w-full rounded-full" onClick={inviteStudent} disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar convite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid gap-3 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4 sm:grid-cols-3 sm:items-center">
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Total</p>
          <p className="mt-1 text-2xl font-bold text-black">{students.length}</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Ativos</p>
          <p className="mt-1 text-2xl font-bold text-black">{activeCount}</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
          <Input
            placeholder="Buscar atleta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-full border-black/10 bg-white pl-9"
          />
        </div>
      </section>

      {pendingLinks.length > 0 ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-black">Solicitações de vínculo ({pendingLinks.length})</p>
          <div className="space-y-2">
            {pendingLinks.map((req) => (
              <div key={req.id} className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-black">{req.athleteName}</p>
                  <p className="truncate text-sm text-black/55">{req.athleteEmail}</p>
                  <p className="mt-1 text-xs text-black/45">
                    {req.requested_at ? format(new Date(req.requested_at), "dd/MM/yyyy") : "Data indisponível"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-10 rounded-full bg-black px-4 text-white"
                    disabled={linkActionId === req.id}
                    onClick={() => resolveLinkRequest(req.id, "approved")}
                  >
                    {linkActionId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-full border-black/20 px-4"
                    disabled={linkActionId === req.id}
                    onClick={() => resolveLinkRequest(req.id, "rejected")}
                  >
                    <UserX className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-black/10 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-black/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-[#fbfbfa] p-8 text-center text-sm text-black/55">
            Nenhum atleta encontrado.
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-black">{s.name || "Sem nome"}</p>
                <p className="truncate text-sm text-black/55">{s.email || "Sem email"}</p>
                <p className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs", s.active ? "bg-black text-white" : "bg-black/10 text-black/65")}>
                  {s.active ? "Ativo" : "Inativo"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-10 rounded-full bg-black px-4 text-white"
                  onClick={() => navigate(`/trainer/atletas/${s.id}/treinos`)}
                >
                  <Calendar className="h-4 w-4" />
                  Agenda
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full border-black/20"
                  onClick={() => {
                    setEditStudent(s);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full border-black/20 text-red-600"
                  onClick={() => {
                    setDeleteStudentId(s.id);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <EditAthleteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={editStudent}
        onSaved={() => trainerId && fetchStudents(trainerId)}
      />

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false);
            setDeleteStudentId(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border-black/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atleta</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const student = students.find((s) => s.id === deleteStudentId);
                return `A remoção de ${student?.name || student?.email || "este atleta"} é irreversível.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentId && deleteStudent(deleteStudentId)}
              disabled={deletingStudent}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deletingStudent ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerAthletes;
