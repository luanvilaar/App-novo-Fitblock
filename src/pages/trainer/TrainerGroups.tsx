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

  if (loading) return <div className="h-12 animate-pulse rounded-xl border border-border bg-background" />;
  if (ranking.length === 0) return null;

  const medalIcon = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}º`;
  };

  return (
    <div className="mt-6 border-t border-border pt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group/rank flex w-full min-w-0 items-center gap-2 text-left font-body text-sm font-normal text-muted-foreground transition-colors hover:text-primary sm:gap-3"
      >
        <Trophy className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 shrink">Ranking de desempenho (30 dias)</span>
        <span className="h-px min-w-[1rem] flex-1 bg-border" />
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
              className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-all sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-4 ${
                i < 3 ? "border-primary/20 bg-primary/10" : "border-border bg-background"
              }`}
            >
              <span className="w-8 shrink-0 text-center font-body text-lg font-semibold text-primary">{medalIcon(i)}</span>
              <span className="min-w-0 flex-1 font-body text-sm font-normal text-foreground">{m.name}</span>
              <div className="flex w-full shrink-0 items-center justify-end gap-6 sm:w-auto sm:justify-start">
                <div className="text-right">
                  <div className="font-body text-[10px] font-normal text-muted-foreground">Protocolos</div>
                  <div className="font-body text-base font-semibold tabular-nums text-foreground">{m.workouts_count}</div>
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
      
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            <Users className="w-3 h-3" />
            Group Logistics
          </div>
          <h1 className="font-display text-5xl font-normal leading-[0.92] tracking-[-0.06em] text-foreground md:text-[4.25rem]">
            Gestão de <span className="text-primary">grupos</span>
          </h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-action px-8 h-12 flex items-center justify-center gap-3">
              <Plus className="w-4 h-4" />
              Criar Novo Grupo
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-xl border border-border bg-card p-10">
            <DialogHeader className="space-y-2 mb-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">New Operational Cluster</div>
              <DialogTitle className="font-display text-3xl font-normal tracking-[-0.04em] text-foreground">Novo grupo</DialogTitle>
              <p className="text-sm text-muted-foreground">Configure um novo agrupamento de atletas para programação coletiva.</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Identificação do Grupo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="EX: TURMA_DELTA_06H" className="h-12 rounded-lg border-border bg-background text-sm text-foreground focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Descrição (Briefing)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ESPECIFICAÇÕES OPCIONAIS" className="h-12 rounded-lg border-border bg-background text-sm text-foreground focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Vincular Unidade (Box)</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger className="h-12 rounded-lg border-border bg-background text-sm text-foreground focus:border-primary">
                    <SelectValue placeholder="SELECIONAR UNIDADE" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card text-foreground">
                    <SelectItem value="none" className="focus:bg-background">NENHUMA</SelectItem>
                    {boxes.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="focus:bg-background">{b.name.toUpperCase()}</SelectItem>
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
          <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-2rem))] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 sm:w-full">
            <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pb-8 pt-8 sm:p-10 sm:pb-10">
              <DialogHeader className="space-y-2 pr-8 text-left sm:pr-10">
                <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">Editar grupo</div>
                <DialogTitle className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground sm:text-3xl">
                  {editingGroup?.name ?? "Configurar grupo"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Altere o nome, a unidade e os membros. O nome é guardado quando sair do campo.
                </p>
              </DialogHeader>
            {editingGroup && (
              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-group-name" className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Nome do grupo</Label>
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
                  }} className="h-12 rounded-lg border-border bg-background text-sm text-foreground focus:border-primary" />
                </div>
                
                <div className="space-y-2">
                  <Label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Vincular Unidade (Box)</Label>
                  <Select value={editBoxId} onValueChange={async (val) => {
                    const newBoxId = val === "none" ? null : val;
                    const { error } = await supabase.from("groups").update({ box_id: newBoxId }).eq("id", editingGroup.id);
                    if (error) { toast.error(error.message); return; }
                    setEditBoxId(val);
                    toast.success("Box atualizada!");
                    if (trainerId) fetchGroups(trainerId);
                    setEditingGroup({ ...editingGroup, box_id: newBoxId });
                  }}>
                    <SelectTrigger className="h-12 rounded-lg border-border bg-background text-sm text-foreground focus:border-primary">
                      <SelectValue placeholder="SELECIONAR UNIDADE" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground">
                      <SelectItem value="none" className="focus:bg-background">NENHUMA</SelectItem>
                      {boxes.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="focus:bg-background">{b.name.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="ml-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Membros ({editingGroup.group_members?.length || 0})
                  </Label>
                  <div className="custom-scrollbar max-h-[min(12rem,35dvh)] space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-4">
                    {editingGroup.group_members?.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-6">Nenhum atleta neste grupo.</p>
                    ) : (
                      editingGroup.group_members?.map((m) => (
                        <div key={m.id} className="group/item flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground transition-colors group-hover/item:text-primary">{getStudentName(m.student_id)}</span>
                          <button
                            type="button"
                            aria-label={`Remover ${getStudentName(m.student_id)} do grupo`}
                            onClick={async () => {
                            await removeMember(m.id);
                            setEditingGroup({
                              ...editingGroup,
                              group_members: editingGroup.group_members.filter(gm => gm.id !== m.id)
                            });
                          }} className="shrink-0 rounded-md p-1 text-foreground/25 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-6">
                  <Label htmlFor="edit-add-member" className="ml-1 text-xs uppercase tracking-[0.16em] text-primary">Adicionar atleta</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      id="edit-add-member"
                      value={editSelectedStudent}
                      onChange={(e) => setEditSelectedStudent(e.target.value)}
                      className="min-h-12 flex-1 cursor-pointer appearance-none rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
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
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-background" />)
          : groups.length === 0
          ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-6 rounded-xl border border-border bg-card py-24 text-center opacity-50">
              <Activity className="w-16 h-16 text-foreground/20" />
              <div className="space-y-1">
                <p className="font-display text-2xl font-normal tracking-[-0.04em] text-foreground">Nenhum grupo detectado</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-foreground/40">AGUARDANDO INICIALIZAÇÃO DE CÉLULAS</p>
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
                <div className="space-y-5 overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-500 group-hover:border-primary/15 sm:space-y-6 sm:p-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-all duration-500 group-hover:border-primary/40 group-hover:bg-primary/5 sm:h-16 sm:w-16">
                        <Users className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="font-display text-xl font-normal leading-tight tracking-[-0.04em] text-foreground transition-colors group-hover:text-primary sm:text-2xl">
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
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 font-body text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Dumbbell className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Protocolos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroup(g);
                          setEditGroupName(g.name);
                          setEditBoxId(g.box_id || "none");
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/50 transition-colors hover:border-primary/20 hover:text-foreground"
                        title="Configurações"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGroup(g.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/50 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
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
                          className="cursor-default rounded-full border border-border bg-background px-3 py-1.5 font-body text-xs font-normal text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
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
