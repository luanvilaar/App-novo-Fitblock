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
    <div className="space-y-24">
      <header className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Gestão de Performance</p>
          <h1 className="font-sans text-5xl font-black tracking-tighter text-black sm:text-7xl lg:text-8xl">
            Atletas.
          </h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="h-16 rounded-full bg-black px-10 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
              <Plus className="w-5 h-5" strokeWidth={3} />
              Novo Atleta
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] border border-black/5 bg-white p-12 shadow-zen">
            <DialogHeader className="space-y-4 mb-10 text-left">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/20">Onboarding</div>
              <DialogTitle className="font-sans text-4xl font-black tracking-tighter text-black">Convidar.</DialogTitle>
              <p className="font-sans text-sm font-medium text-black/40">Insira as credenciais para envio de convite oficial.</p>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Nome completo</Label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Ex: João Silva" className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0" />
              </div>
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">E-mail corporativo</Label>
                <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="joao@exemplo.com" className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0" />
              </div>
              <button 
                className="w-full h-20 rounded-full bg-black text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4" 
                onClick={inviteStudent} 
                disabled={adding}
              >
                {adding ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar Convite"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {pendingLinks.length > 0 && (
        <section className="space-y-12">
          <div className="flex items-center gap-6">
             <div className="font-sans text-3xl font-black tracking-tight text-black">Solicitações.</div>
             <div className="h-px flex-1 bg-black/5" />
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white font-sans text-sm font-black">
                {pendingLinks.length}
             </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pendingLinks.map((req) => (
              <div
                key={req.id}
                className="relative group space-y-10 rounded-[3rem] border border-black/5 bg-white p-10 shadow-sm transition-all hover:shadow-zen"
              >
                <div className="space-y-2">
                  <div className="font-sans text-3xl font-black tracking-tighter text-black">{req.athleteName.toLowerCase()}</div>
                  <div className="truncate font-mono text-[9px] font-black text-black/30 uppercase tracking-widest">{req.athleteEmail}</div>
                </div>
                
                <div className="flex items-center justify-between border-t border-black/5 pt-8">
                   <div className="font-mono text-[9px] font-black uppercase tracking-widest text-black/20">
                      {req.requested_at ? format(new Date(req.requested_at), "dd MMM yy") : "N/A"}
                   </div>
                   <div className="flex gap-3">
                      <button
                        disabled={linkActionId === req.id}
                        onClick={() => resolveLinkRequest(req.id, "approved")}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition-all active:scale-90"
                      >
                        {linkActionId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-6 h-6" strokeWidth={3} />}
                      </button>
                      <button
                        disabled={linkActionId === req.id}
                        onClick={() => resolveLinkRequest(req.id, "rejected")}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3f3] text-black/30 transition-all active:scale-90 hover:bg-red-500 hover:text-white"
                      >
                        <UserX className="w-6 h-6" strokeWidth={3} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between border-t border-black/5 pt-16">
         <div className="flex gap-6">
            <div className="min-w-[180px] rounded-[3rem] bg-white ring-1 ring-black/5 p-10 shadow-sm">
               <div className="font-mono text-[9px] font-black uppercase tracking-widest text-black/20 mb-4">Ativos</div>
               <div className="font-sans text-6xl font-black leading-none tracking-tighter text-black">{activeCount}</div>
            </div>
            <div className="min-w-[180px] rounded-[3rem] bg-white ring-1 ring-black/5 p-10 shadow-sm">
               <div className="font-mono text-[9px] font-black uppercase tracking-widest text-black/20 mb-4">Pendentes</div>
               <div className="font-sans text-6xl font-black leading-none tracking-tighter text-black">{inactiveCount}</div>
            </div>
         </div>

         <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20" />
            <Input 
              placeholder="Buscar atletas..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-16 rounded-full border-black/5 bg-[#f3f3f3] pl-16 pr-8 text-sm font-bold text-black transition-all focus:border-black/10 focus:ring-0" 
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 animate-pulse rounded-[3rem] bg-[#f3f3f3]" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-40 text-center rounded-[3rem] bg-[#f3f3f3] ring-1 ring-black/5">
            <Activity className="w-24 h-24 text-black/10 mb-10" />
            <div className="space-y-4">
              <p className="font-sans text-3xl font-black tracking-tighter text-black/20 uppercase">Sem resultados</p>
              <p className="font-mono text-[10px] font-black text-black/10 uppercase tracking-widest">Tente outro termo de busca</p>
            </div>
          </div>
        ) : (
          filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group"
            >
              <div className={cn(
                "flex h-full flex-col space-y-12 rounded-[3rem] p-10 transition-all duration-500 ring-1",
                !s.active 
                  ? "bg-[#f3f3f3] ring-black/5" 
                  : "bg-white ring-black/5 group-hover:ring-black/10 shadow-sm hover:shadow-zen"
              )} >
                <div className="flex items-center gap-8">
                   <div className={cn(
                     "flex h-24 w-24 shrink-0 items-center justify-center rounded-full font-sans text-4xl font-black tracking-tighter transition-all duration-500",
                     s.active ? "bg-black text-white" : "bg-black/10 text-white"
                   )}>
                     {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                   </div>
                   <div className="min-w-0 space-y-2">
                      <h3 className="truncate font-sans text-3xl font-black tracking-tighter text-black transition-colors group-hover:text-black/70">
                        {s.name ? s.name.toLowerCase() : "sem nome"}
                      </h3>
                      <p className="truncate font-mono text-[9px] font-black uppercase tracking-widest text-black/30">{s.email}</p>
                   </div>
                </div>

                {!s.active && (
                   <div className="flex items-center gap-3 rounded-full bg-black/5 px-6 py-2.5 w-fit">
                      <span className="h-2 w-2 rounded-full bg-black/20 animate-pulse" />
                      <span className="font-mono text-[9px] font-black uppercase tracking-widest text-black/40">Inativo</span>
                   </div>
                )}

                <div className="flex items-center justify-between gap-6 border-t border-black/5 pt-10">
                   <button
                     onClick={() => navigate(`/trainer/atletas/${s.id}/treinos`)}
                     className="h-14 flex-1 rounded-full bg-[#f3f3f3] text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white flex items-center justify-center gap-3"
                   >
                     <Calendar className="w-5 h-5" strokeWidth={3} /> Agenda
                   </button>
                   
                   <div className="flex gap-3">
                      <button
                        onClick={() => { setEditStudent(s); setEditOpen(true); }}
                        className="h-14 w-14 flex items-center justify-center rounded-full bg-[#f3f3f3] text-black/30 transition-all hover:bg-black hover:text-white"
                      >
                        <Pencil className="w-5 h-5" strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => { setDeleteStudentId(s.id); setShowDeleteConfirm(true); }}
                        className="h-14 w-14 flex items-center justify-center rounded-full bg-[#f3f3f3] text-black/30 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={3} />
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
        <AlertDialogContent className="rounded-[3rem] border border-black/5 bg-white p-12 shadow-zen">
          <AlertDialogHeader className="space-y-4 mb-10 text-left">
            <div className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Atenção</div>
            <AlertDialogTitle className="font-sans text-5xl font-black tracking-tighter text-black">Excluir.</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-lg font-medium text-black/40 leading-relaxed">
              {(() => {
                const student = students.find((s) => s.id === deleteStudentId);
                return <>A remoção de <span className="text-black font-black">{student?.name || student?.email}</span> é irreversível. Todos os dados históricos serão desconectados.</>;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end mt-6">
            <AlertDialogCancel className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-10 text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white outline-none">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentId && deleteStudent(deleteStudentId)}
              disabled={deletingStudent}
              className="h-16 rounded-full bg-red-500 px-10 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 border-none"
            >
              {deletingStudent ? "Processando..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerAthletes;
