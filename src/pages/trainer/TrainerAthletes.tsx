import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, UserCheck, UserX, Mail, Trash2, Users, Pencil, Radar, Target, Loader2, Inbox, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import EditAthleteDialog from "@/components/trainer/EditAthleteDialog";

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
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
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

  const navigate = useNavigate();
  const [pendingLinks, setPendingLinks] = useState<PendingLinkRequest[]>([]);
  const [linkActionId, setLinkActionId] = useState<string | null>(null);

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
      })
    );
  }, []);

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
    if (status === "approved") fetchStudents(trainerId);
  };

  const fetchStudents = async (tid: string) => {
    const { data: rawStudents } = await supabase
      .from("students")
      .select("id, user_id, active")
      .eq("trainer_id", tid)
      .order("active", { ascending: false });
    if (!rawStudents || rawStudents.length === 0) { setStudents([]); setLoading(false); return; }

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
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (trainer) {
        setTrainerId(trainer.id);
        fetchStudents(trainer.id);
        fetchPendingLinks(trainer.id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user, fetchPendingLinks]);

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
            toast.info("Novo pedido de vínculo. Aprove em Pedidos de vínculo abaixo.");
            fetchPendingLinks(trainerId);
          }
        }
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
          fetchPendingLinks(trainerId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId, fetchPendingLinks]);

  const inviteStudent = async () => {
    if (!trainerId || !addEmail.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-athlete", {
        body: { email: addEmail.trim(), trainer_id: trainerId, name: addName.trim() || undefined },
      });
      if (error) throw error;
      toast.success(data?.message || "Convite enviado!");
      setAddEmail("");
      setAddName("");
      setDialogOpen(false);
      fetchStudents(trainerId);
      fetchPendingLinks(trainerId);
    } catch (e: any) {
      toast.error(e.message || "Erro ao convidar atleta");
    }
    setAdding(false);
  };

  const toggleActive = async (studentId: string, currentActive: boolean) => {
    await supabase.from("students").update({ active: !currentActive }).eq("id", studentId);
    if (trainerId) fetchStudents(trainerId);
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
      toast.success("Atleta removido com sucesso");
    } catch (err: any) {
      console.error("Error deleting student:", err);
      setStudents(previousStudents);
      toast.error(err.message || "Erro ao remover atleta");
    } finally {
      setDeletingStudent(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = filtered.filter(s => s.active).length;
  const inactiveCount = filtered.filter(s => !s.active).length;

  return (
    <div className="space-y-10 pb-12 pt-6">
      <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-border bg-card p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-[11px] uppercase tracking-[0.22em]">
            <Users className="w-3 h-3" />
            Atletas
          </div>
          <h1 className="text-5xl font-medium leading-[0.92] tracking-[-0.06em] text-foreground md:text-[4.25rem]">
            Gestão de <span className="text-primary">atletas</span>
          </h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-action px-8 h-12 flex items-center justify-center gap-3">
              <Plus className="w-4 h-4" />
              Convidar Atleta
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] border border-border bg-card p-8">
            <DialogHeader className="space-y-2 mb-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Convite</div>
              <DialogTitle className="font-display text-3xl font-normal tracking-[-0.04em] text-foreground">Adicionar atleta</DialogTitle>
              <p className="text-sm text-muted-foreground">Expedição de convite para inclusão de novo atleta no sistema.</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-medium text-muted-foreground">Nome completo</Label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nome do atleta" className="h-12 rounded-2xl border-border bg-background text-sm text-foreground focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-medium text-muted-foreground">E-mail</Label>
                <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@exemplo.com" className="h-12 rounded-2xl border-border bg-background text-sm text-foreground focus:border-primary" />
              </div>
              <button 
                className="w-full h-14 btn-action flex items-center justify-center gap-3" 
                onClick={inviteStudent} 
                disabled={adding}
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Convite"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingLinks.length > 0 && (
        <div className="space-y-6 border-b border-border pb-12">
         <div className="flex items-center gap-4">
             <Inbox className="w-4 h-4 text-primary" />
             <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Solicitações pendentes ({pendingLinks.length})</div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingLinks.map((req) => (
              <div
                key={req.id}
                className="relative group space-y-5 rounded-[24px] border border-primary/20 bg-card p-6"
              >
                <div className="space-y-1">
                  <div className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground">{req.athleteName}</div>
                  <div className="truncate text-sm text-muted-foreground">{req.athleteEmail}</div>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/80 pt-4">
                   <div className="text-xs text-muted-foreground">
                      Solicitado em {req.requested_at ? format(new Date(req.requested_at), "dd/MM/yy") : "N/A"}
                   </div>
                   <div className="flex gap-2">
                      <button
                        disabled={linkActionId === req.id}
                        onClick={() => resolveLinkRequest(req.id, "approved")}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white transition-all hover:brightness-110"
                      >
                        {linkActionId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                      <button
                        disabled={linkActionId === req.id}
                        onClick={() => resolveLinkRequest(req.id, "rejected")}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground/40 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
         <div className="flex gap-4">
            <div className="min-w-[140px] rounded-[24px] border border-border bg-card px-6 py-4">
               <div className="mb-1 text-xs text-muted-foreground">Atletas ativos</div>
               <div className="font-display text-3xl font-normal leading-none tracking-[-0.04em] text-foreground">{activeCount}</div>
            </div>
            <div className="min-w-[140px] rounded-[24px] border border-border bg-card px-6 py-4">
               <div className="mb-1 text-xs text-muted-foreground">Pendentes</div>
               <div className="font-display text-3xl font-normal leading-none tracking-[-0.04em] text-primary">{inactiveCount}</div>
            </div>
         </div>

         <div className="relative w-full lg:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input 
              placeholder="Buscar atletas..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-12 rounded-full border-border bg-card pl-12 text-sm text-foreground transition-all focus:border-primary" 
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-background" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-6 rounded-[28px] border border-border bg-card py-24 text-center opacity-60">
            <Activity className="w-16 h-16 text-foreground/20" />
            <div className="space-y-1">
              <p className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground">Nenhum atleta detectado</p>
              <p className="text-sm text-muted-foreground">Verifique os parâmetros de busca.</p>
            </div>
          </div>
        ) : (
          filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative group"
            >
              <div className={`flex h-full flex-col space-y-6 rounded-[24px] border p-6 transition-all duration-500 ${!s.active ? "border-primary/30 bg-primary/5" : "border-border bg-card group-hover:border-primary/20"}`} >
                <div className="flex items-center gap-5">
                   <div className={`flex h-16 w-16 items-center justify-center rounded-xl border font-display text-2xl font-normal tracking-[-0.04em] transition-all duration-500 ${
                     s.active ? "border-primary/10 bg-primary/5 text-primary" : "border-primary/40 bg-primary/15 text-primary"
                   }`}>
                     {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                   </div>
                   <div className="min-w-0 space-y-1">
                      <div className="flex flex-col">
                        <p className="truncate font-display text-2xl font-normal leading-none tracking-[-0.04em] text-foreground transition-colors group-hover:text-primary">{s.name || "Sem Nome"}</p>
                        <p className="mt-2 truncate text-sm text-muted-foreground">{s.email}</p>
                      </div>
                   </div>
                </div>

                {!s.active && (
                   <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <span className="text-xs font-medium text-primary">Aguardando ativação</span>
                   </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-6">
                   <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/trainer/atletas/${s.id}/treinos`)}
                        className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/20 hover:text-primary"
                      >
                        <Calendar className="w-3.5 h-3.5 text-primary/60" /> Calendário
                      </button>
                   </div>
                   
                   <div className="flex gap-2">
                      <button
                        onClick={() => { setEditStudent(s); setEditOpen(true); }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground/40 transition-all hover:border-primary/20 hover:text-primary"
                        title="Editar Perfil"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(s.id, s.active)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                          s.active ? "border-border bg-background text-foreground/40 hover:border-primary/20 hover:text-primary" : "border-primary/40 bg-primary/15 text-primary"
                        }`}
                        title={s.active ? "Desativar Acesso" : "Ativar Acesso"}
                      >
                        {s.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setDeleteStudentId(s.id); setShowDeleteConfirm(true); }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground/40 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                        title="Remover Atleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <EditAthleteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={editStudent}
        onSaved={() => trainerId && fetchStudents(trainerId)}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!open) { setShowDeleteConfirm(false); setDeleteStudentId(null); }
      }}>
        <AlertDialogContent className="rounded-[28px] border border-border bg-card p-8">
          <AlertDialogHeader className="space-y-4 mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">Remoção</div>
            <AlertDialogTitle className="flex items-center gap-4 text-3xl font-medium tracking-[-0.04em] text-foreground">
                <Target className="w-10 h-10 text-destructive" /> Remover atleta?
            </AlertDialogTitle>
            <AlertDialogDescription className="border-l border-destructive/40 pl-4 py-1 text-sm leading-relaxed text-muted-foreground">
              {(() => {
                const student = students.find((s) => s.id === deleteStudentId);
                return <>A remoção de <span className="text-foreground font-medium">{student?.name || student?.email}</span> é irreversível. Logs e vínculos de treino serão desconectados.</>;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end mt-4">
            <AlertDialogCancel className="h-12 rounded-full border-border px-8 text-sm font-medium text-foreground outline-none hover:bg-primary/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentId && deleteStudent(deleteStudentId)}
              disabled={deletingStudent}
              className="h-12 rounded-full bg-destructive px-8 text-sm font-medium text-white hover:brightness-110"
            >
              {deletingStudent ? "Removendo..." : "Confirmar exclusão"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerAthletes;
