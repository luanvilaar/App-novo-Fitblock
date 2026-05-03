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

  if (loading) return <div className="h-12 animate-pulse bg-white/5 border border-white/5 rounded-2xl" />;
  if (ranking.length === 0) return null;

  const medalIcon = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}º`;
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group/rank flex w-full min-w-0 items-center gap-2 text-left font-body text-sm font-normal text-muted-foreground transition-colors hover:text-primary sm:gap-3"
      >
        <Trophy className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 shrink">Ranking de desempenho (30 dias)</span>
        <span className="h-px min-w-[1rem] flex-1 bg-white/10" />
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          {ranking.map((m, i) => (
            <div
              key={m.student_id}
              className={`flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-all sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-4 ${
                i < 3 ? "border-primary/20 bg-primary/10" : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <span className="w-8 shrink-0 text-center font-body text-lg font-semibold text-primary">{medalIcon(i)}</span>
              <span className="min-w-0 flex-1 font-body text-sm font-normal text-white">{m.name}</span>
              <div className="flex w-full shrink-0 items-center justify-end gap-6 sm:w-auto sm:justify-start">
                <div className="text-right">
                  <div className="font-body text-[10px] font-normal text-muted-foreground">Protocolos</div>
                  <div className="font-body text-base font-semibold tabular-nums text-white">{m.workouts_count}</div>
                </div>
                <div className="text-right">
                  <div className="font-body text-[10px] font-normal text-primary/80">Score</div>
                  <div className="font-body text-base font-semibold tabular-nums text-primary">{Math.round(m.score)}</div>
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
    <div className="space-y-10 pb-12 pt-6">
      
      {/* ── CLEAN PREMIUM HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
            <Users className="w-3 h-3" />
            Group Logistics
          </div>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-white leading-none">
            Gestão de <span className="text-white/40 italic">Grupos</span>
          </h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-action px-8 h-12 flex items-center justify-center gap-3">
              <Plus className="w-4 h-4" />
              Criar Novo Grupo
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
            <DialogHeader className="space-y-2 mb-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary font-bold">New Operational Cluster</div>
              <DialogTitle className="font-display text-3xl uppercase tracking-tight text-white">Novo Grupo</DialogTitle>
              <p className="text-muted-foreground text-sm font-medium">Configure um novo agrupamento de atletas para programação coletiva.</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Identificação do Grupo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="EX: TURMA_DELTA_06H" className="h-12 border-white/10 bg-white/5 focus:border-primary text-sm text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Descrição (Briefing)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ESPECIFICAÇÕES OPCIONAIS" className="h-12 border-white/10 bg-white/5 focus:border-primary text-sm text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Vincular Unidade (Box)</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger className="h-12 border-white/10 bg-white/5 text-sm text-white rounded-xl focus:border-primary">
                    <SelectValue placeholder="SELECIONAR UNIDADE" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    <SelectItem value="none" className="focus:bg-white/10">NENHUMA</SelectItem>
                    {boxes.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="focus:bg-white/10">{b.name.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button 
                onClick={createGroup} 
                className="w-full h-14 btn-action flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Grupo"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-2rem))] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden bg-card/90 p-0 shadow-2xl backdrop-blur-2xl sm:w-full sm:rounded-[2.5rem] border border-white/10 rounded-[2rem]">
            <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pb-8 pt-8 sm:p-10 sm:pb-10">
              <DialogHeader className="space-y-2 pr-8 text-left sm:pr-10">
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Editar grupo</div>
                <DialogTitle className="font-display text-2xl uppercase tracking-tight text-white sm:text-3xl">
                  {editingGroup?.name ?? "Configurar grupo"}
                </DialogTitle>
                <p className="text-muted-foreground text-sm font-medium">
                  Altere o nome, a unidade e os membros. O nome é guardado quando sair do campo.
                </p>
              </DialogHeader>
            {editingGroup && (
              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-group-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Nome do grupo</Label>
                  <Input id="edit-group-name" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} onBlur={async () => {
                    if (!editGroupName.trim() || editGroupName === editingGroup.name) return;
                    const { error } = await supabase.from("groups").update({ name: editGroupName.trim() }).eq("id", editingGroup.id);
                    if (error) {
                      toast.error(error.message);
                      setEditGroupName(editingGroup.name);
                      return;
                    }
                    toast.success("Nome atualizado");
                    setEditingGroup({ ...editingGroup, name: editGroupName.trim() });
                    if (trainerId) fetchGroups(trainerId);
                  }} className="h-12 border-white/10 bg-white/5 focus:border-primary text-sm text-white rounded-xl" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Vincular Unidade (Box)</Label>
                  <Select value={editBoxId} onValueChange={async (val) => {
                    const newBoxId = val === "none" ? null : val;
                    const { error } = await supabase.from("groups").update({ box_id: newBoxId }).eq("id", editingGroup.id);
                    if (error) { toast.error(error.message); return; }
                    setEditBoxId(val);
                    toast.success("Box atualizada!");
                    if (trainerId) fetchGroups(trainerId);
                    setEditingGroup({ ...editingGroup, box_id: newBoxId });
                  }}>
                    <SelectTrigger className="h-12 border-white/10 bg-white/5 text-sm text-white rounded-xl focus:border-primary">
                      <SelectValue placeholder="SELECIONAR UNIDADE" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      <SelectItem value="none" className="focus:bg-white/10">NENHUMA</SelectItem>
                      {boxes.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="focus:bg-white/10">{b.name.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Membros ({editingGroup.group_members?.length || 0})
                  </Label>
                  <div className="max-h-[min(12rem,35dvh)] overflow-y-auto space-y-2 p-4 border border-white/5 bg-black/20 rounded-2xl custom-scrollbar">
                    {editingGroup.group_members?.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-6">Nenhum atleta neste grupo.</p>
                    ) : (
                      editingGroup.group_members?.map((m) => (
                        <div key={m.id} className="flex justify-between items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl group/item">
                          <span className="min-w-0 flex-1 truncate text-sm text-white font-medium group-hover/item:text-primary transition-colors">{getStudentName(m.student_id)}</span>
                          <button
                            type="button"
                            aria-label={`Remover ${getStudentName(m.student_id)} do grupo`}
                            onClick={async () => {
                            await removeMember(m.id);
                            setEditingGroup({
                              ...editingGroup,
                              group_members: editingGroup.group_members.filter(gm => gm.id !== m.id)
                            });
                          }} className="shrink-0 text-white/20 hover:text-red-500 transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <Label htmlFor="edit-add-member" className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Adicionar atleta</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      id="edit-add-member"
                      value={editSelectedStudent}
                      onChange={(e) => setEditSelectedStudent(e.target.value)}
                      className="flex-1 min-h-12 border border-white/10 bg-white/5 px-4 rounded-xl text-sm text-white focus:border-primary focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
                      disabled={getAvailableStudents(editingGroup).length === 0}
                    >
                      {getAvailableStudents(editingGroup).length === 0 ? (
                        <option value="" className="bg-card">
                          {allStudents.length === 0
                            ? "Sem atletos ativos na base"
                            : "Todos os atletas já estão neste grupo"}
                        </option>
                      ) : (
                        <>
                          <option value="" className="bg-card">
                            Selecionar atleta…
                          </option>
                          {getAvailableStudents(editingGroup).map((s) => (
                            <option key={s.id} value={s.id} className="bg-card">
                              {s.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editSelectedStudent) {
                          toast.info("Selecione um atleta na lista.");
                          return;
                        }
                        const sid = editSelectedStudent;
                        const newMember = await addMemberToGroup(editingGroup.id, sid);
                        if (newMember) {
                          setEditSelectedStudent("");
                          setEditingGroup({
                            ...editingGroup,
                            group_members: [...(editingGroup.group_members || []), { id: newMember.id, student_id: sid }]
                          });
                        }
                      }}
                      disabled={getAvailableStudents(editingGroup).length === 0}
                      className="h-12 shrink-0 px-6 btn-action flex items-center justify-center font-bold disabled:pointer-events-none disabled:opacity-40"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-56 bg-white/5 border border-white/5 rounded-[2rem] animate-pulse" />)
          : groups.length === 0
          ? (
            <div className="col-span-full py-24 bg-card/30 border border-white/5 rounded-[3rem] text-center flex flex-col items-center justify-center gap-6 shadow-2xl opacity-40">
              <Activity className="w-16 h-16 text-white/20" />
              <div className="space-y-1">
                <p className="font-display text-2xl uppercase tracking-tight text-white">Nenhum grupo detectado</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">AGUARDANDO INICIALIZAÇÃO DE CÉLULAS</p>
              </div>
            </div>
          )
          : groups.map((g, i) => (
              <motion.div 
                key={g.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.03 }}
                className="relative group"
              >
                <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/50 p-6 shadow-xl backdrop-blur-md transition-all duration-500 space-y-5 sm:p-8 sm:space-y-6 group-hover:border-white/20">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all duration-500 group-hover:border-primary/40 group-hover:bg-primary/10 sm:h-16 sm:w-16">
                        <Users className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="font-body text-xl font-semibold leading-tight tracking-tight text-white transition-colors group-hover:text-primary sm:text-2xl">
                          {g.name}
                        </h3>
                        <p className="font-body text-xs font-normal leading-relaxed text-muted-foreground">
                          <span className="text-primary">{g.group_members?.length || 0} membros ativos</span>
                          {g.description ? (
                            <>
                              {" · "}
                              <span className="line-clamp-2 sm:line-clamp-1">{g.description}</span>
                            </>
                          ) : null}
                          {g.box_id ? (
                            <>
                              {" · "}
                              {getBoxName(g.box_id) || "Unidade"}
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/trainer/grupos/${g.id}/treinos`)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/35 bg-primary/15 px-4 font-body text-xs font-semibold text-white/95 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
                        <span className="hidden sm:inline">Protocolos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroup(g);
                          setEditGroupName(g.name);
                          setEditBoxId(g.box_id || "none");
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        title="Configurações"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGroup(g.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-400"
                        title="Remover grupo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {g.group_members && g.group_members.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {g.group_members.map((m) => (
                        <span
                          key={m.id}
                          className="cursor-default rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-body text-xs font-normal text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                        >
                          {getStudentName(m.student_id)}
                        </span>
                      ))}
                    </div>
                  )}

                  <RankingSection groupId={g.id} />
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
};

export default TrainerGroups;
