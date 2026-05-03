import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Trash2, Edit2, Trophy, ChevronDown, ChevronUp, Dumbbell, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useGroupRanking } from "@/hooks/useGroupRanking";

interface StudentInfo {
  id: string;
  name: string;
}

interface BoxOption {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  box_id: string | null;
  group_members: { id: string; student_id: string }[];
}

const RankingSection = ({ groupId }: { groupId: string }) => {
  const { ranking, loading } = useGroupRanking(groupId);
  const [expanded, setExpanded] = useState(false);

  if (loading) return <div className="h-12 animate-pulse rounded-2xl border border-black/5 bg-[#f3f3f3]" />;
  if (ranking.length === 0) return null;

  const medalIcon = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}º`;
  };

  return (
    <div className="mt-8 border-t border-black/5 pt-8">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group/rank flex w-full min-w-0 items-center gap-3 text-left transition-all"
      >
        <Trophy className="h-4 w-4 shrink-0 text-black" />
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">Leaderboard Mensal</span>
        <span className="h-px flex-1 bg-black/5" />
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-black" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-black/20" />
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-3"
        >
          {ranking.map((m, i) => (
            <div
              key={m.student_id}
              className={cn(
                "flex min-w-0 flex-wrap items-center gap-4 rounded-2xl p-4 transition-all sm:flex-nowrap",
                i < 3 ? "bg-black text-white shadow-lg" : "bg-[#f3f3f3] text-black"
              )}
            >
              <span className={cn("w-10 shrink-0 text-center font-sans text-lg font-black", i < 3 ? "text-white" : "text-black/20")}>{medalIcon(i)}</span>
              <span className="min-w-0 flex-1 font-sans text-sm font-black uppercase tracking-tight">{m.name.toLowerCase()}</span>
              <div className="flex w-full shrink-0 items-center justify-end gap-6 sm:w-auto">
                <div className="text-right">
                  <div className={cn("font-mono text-[8px] font-black uppercase tracking-widest", i < 3 ? "text-white/40" : "text-black/20")}>Treinos</div>
                  <div className="font-sans text-base font-black tabular-nums">{m.workouts_count}</div>
                </div>
                <div className="text-right">
                  <div className={cn("font-mono text-[8px] font-black uppercase tracking-widest", i < 3 ? "text-white/60" : "text-black/40")}>Score</div>
                  <div className="font-sans text-base font-black tabular-nums">{Math.round(m.score)}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const TrainerGroups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("none");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editBoxId, setEditBoxId] = useState<string>("none");
  const [editSelectedStudent, setEditSelectedStudent] = useState("");

  const fetchGroups = async (tid: string) => {
    const { data } = await supabase
      .from("groups")
      .select("id, name, description, box_id, group_members(id, student_id)")
      .eq("trainer_id", tid)
      .order("created_at", { ascending: false });
    if (data) setGroups(data as Group[]);
    setLoading(false);
  };

  const fetchStudents = async (tid: string) => {
    const { data: rawSts } = await supabase
      .from("students")
      .select("id, user_id")
      .eq("trainer_id", tid)
      .eq("active", true);
    if (!rawSts || rawSts.length === 0) return;
    const userIds = rawSts.map((s) => s.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const pMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);
    setAllStudents(rawSts.map((s) => ({ id: s.id, name: pMap.get(s.user_id) || "Sem nome" })));
  };

  const fetchBoxes = async () => {
    const { data } = await supabase.from("boxes").select("id, name").order("name");
    if (data) setBoxes(data);
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
        await Promise.all([fetchGroups(trainer.id), fetchStudents(trainer.id), fetchBoxes()]);
      } else setLoading(false);
    };
    init();
  }, [user]);

  const createGroup = async () => {
    if (!trainerId || !name.trim()) return;
    const { error } = await supabase
      .from("groups")
      .insert({
        trainer_id: trainerId,
        name: name.trim(),
        description: description.trim() || null,
        box_id: selectedBoxId === "none" ? null : selectedBoxId,
      });
    if (error) { toast.error(error.message); return; }
    toast.success("Grupo criado!");
    setName("");
    setDescription("");
    setSelectedBoxId("none");
    setDialogOpen(false);
    fetchGroups(trainerId);
  };

  const deleteGroup = async (groupId: string) => {
    await supabase.from("groups").delete().eq("id", groupId);
    if (trainerId) fetchGroups(trainerId);
    toast.success("Grupo removido");
  };

  const addMemberToGroup = async (groupId: string, studentId: string) => {
    if (!studentId) return null;
    const { data, error } = await supabase.from("group_members").insert({ group_id: groupId, student_id: studentId }).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success("Membro adicionado!");
    if (trainerId) fetchGroups(trainerId);
    return data;
  };

  const removeMember = async (memberId: string) => {
    await supabase.from("group_members").delete().eq("id", memberId);
    if (trainerId) fetchGroups(trainerId);
    toast.success("Membro removido");
  };

  const getStudentName = (studentId: string) => allStudents.find((s) => s.id === studentId)?.name || "Sem nome";
  const getBoxName = (boxId: string | null) => boxes.find((b) => b.id === boxId)?.name || null;

  const getAvailableStudents = (group: Group) => {
    const memberIds = new Set(group.group_members?.map((m) => m.student_id) || []);
    return allStudents.filter((s) => !memberIds.has(s.id));
  };

  return (
    <div className="space-y-24">
      <header className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Gestão de Grupos</p>
          <h1 className="font-sans text-5xl font-black tracking-tighter text-black sm:text-7xl lg:text-8xl">
            Comunidades.
          </h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="h-16 rounded-full bg-black px-10 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
              <Plus className="w-5 h-5" strokeWidth={3} />
              Novo Grupo
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] border border-black/5 bg-white p-12 shadow-zen">
            <DialogHeader className="space-y-4 mb-10 text-left">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/20">Configuração</div>
              <DialogTitle className="font-sans text-4xl font-black tracking-tighter text-black">Novo grupo.</DialogTitle>
              <p className="font-sans text-sm font-medium text-black/40">Agrupe seus atletas para protocolos coletivos.</p>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Identificação</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Elite 06h" className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0" />
              </div>
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Descrição breve</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:border-black/10 focus:ring-0" />
              </div>
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Unidade (Box)</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:ring-0">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-black/5 bg-white shadow-zen">
                    <SelectItem value="none" className="font-bold">Nenhuma</SelectItem>
                    {boxes.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="font-bold">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button 
                onClick={createGroup} 
                className="w-full h-20 rounded-full bg-black text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Criar Grupo"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {loading
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-80 animate-pulse rounded-[3rem] bg-[#f3f3f3]" />)
          : groups.length === 0
          ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 text-center rounded-[3rem] bg-[#f3f3f3] ring-1 ring-black/5">
              <Activity className="w-24 h-24 text-black/10 mb-10" />
              <p className="text-3xl font-black text-black/20 uppercase tracking-tighter">Nenhum grupo encontrado</p>
            </div>
          )
          : groups.map((g, i) => (
              <motion.div 
                key={g.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.03 }}
                className="group"
              >
                <div className="rounded-[3rem] border border-black/5 bg-white p-10 transition-all hover:ring-1 hover:ring-black/10 shadow-sm hover:shadow-zen">
                  <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-8">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-xl">
                        <Users className="h-8 w-8" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="truncate font-sans text-3xl font-black tracking-tighter text-black transition-colors group-hover:text-black/70">
                          {g.name.toLowerCase()}
                        </h3>
                        <div className="flex items-center gap-3">
                           <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">
                             <span className="text-black">{g.group_members?.length || 0} Atletas</span>
                             {g.box_id ? ` · ${getBoxName(g.box_id)}` : ""}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        onClick={() => navigate(`/trainer/grupos/${g.id}/treinos`)}
                        className="h-14 flex items-center gap-3 rounded-full bg-[#f3f3f3] px-8 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
                      >
                        <Dumbbell className="h-5 w-5" strokeWidth={3} /> Treinos
                      </button>
                      <button
                        onClick={() => {
                          setEditingGroup(g);
                          setEditGroupName(g.name);
                          setEditBoxId(g.box_id || "none");
                        }}
                        className="h-14 w-14 flex items-center justify-center rounded-full bg-[#f3f3f3] text-black/30 transition-all hover:bg-black hover:text-white"
                      >
                        <Edit2 className="h-5 w-5" strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => deleteGroup(g.id)}
                        className="h-14 w-14 flex items-center justify-center rounded-full bg-[#f3f3f3] text-black/30 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-5 w-5" strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {g.group_members && g.group_members.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-12">
                      {g.group_members.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-full bg-[#f3f3f3] px-5 py-2.5 font-mono text-[9px] font-black uppercase tracking-widest text-black/40"
                        >
                          {getStudentName(m.student_id).toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  <RankingSection groupId={g.id} />
                </div>
              </motion.div>
            ))}
      </div>

      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent className="rounded-[3rem] border border-black/5 bg-white p-12 shadow-zen max-w-2xl">
          <DialogHeader className="space-y-4 mb-10 text-left">
            <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/20">Gestão</div>
            <DialogTitle className="font-sans text-4xl font-black tracking-tighter text-black">Editar.</DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-10">
              <div className="space-y-3">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Nome do Grupo</Label>
                <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} onBlur={async () => {
                  if (!editGroupName.trim() || editGroupName === editingGroup.name) return;
                  const { error } = await supabase.from("groups").update({ name: editGroupName.trim() }).eq("id", editingGroup.id);
                  if (error) { toast.error(error.message); return; }
                  toast.success("Nome atualizado");
                  setEditingGroup({ ...editingGroup, name: editGroupName.trim() });
                  if (trainerId) fetchGroups(trainerId);
                }} className="h-16 rounded-full border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:ring-0" />
              </div>
              
              <div className="space-y-6">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Membros Atuais</Label>
                <div className="max-h-64 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                  {editingGroup.group_members?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-[2rem] bg-[#f3f3f3] p-5">
                      <span className="font-sans text-xs font-black uppercase tracking-widest text-black">{getStudentName(m.student_id).toLowerCase()}</span>
                      <button onClick={async () => {
                        await removeMember(m.id);
                        setEditingGroup({ ...editingGroup, group_members: editingGroup.group_members.filter(gm => gm.id !== m.id) });
                      }} className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black/20 hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 space-y-6">
                <Label className="ml-6 text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Adicionar Atleta</Label>
                <div className="flex gap-4">
                  <select
                    value={editSelectedStudent}
                    onChange={(e) => setEditSelectedStudent(e.target.value)}
                    className="h-16 flex-1 rounded-full border border-black/5 bg-[#f3f3f3] px-8 text-sm font-bold text-black focus:ring-0 outline-none appearance-none"
                  >
                    <option value="">Selecionar...</option>
                    {getAvailableStudents(editingGroup).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!editSelectedStudent) return;
                      const newMember = await addMemberToGroup(editingGroup.id, editSelectedStudent);
                      if (newMember) {
                        setEditSelectedStudent("");
                        setEditingGroup({ ...editingGroup, group_members: [...(editingGroup.group_members || []), { id: newMember.id, student_id: editSelectedStudent }] });
                      }
                    }}
                    className="h-16 px-10 rounded-full bg-black text-[10px] font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerGroups;
