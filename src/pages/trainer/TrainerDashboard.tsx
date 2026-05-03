import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Layers, 
  Dumbbell, 
  TrendingUp, 
  UserPlus, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Cpu, 
  Radar,
  Shield,
  Inbox,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PremiumActivityChart from "@/components/PremiumActivityChart";
import { TrainerPanelCard, TrainerPanelCardMedia } from "@/components/trainer/TrainerPanelCard";
import heroImage from "@/assets/crossfit-program.jpg";

interface PendingStudent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

interface DayProgress {
  workout_id: string;
  title: string;
  group_name: string | null;
  total_students: number;
  completed_students: number;
  students: { id: string; name: string; completed: boolean }[];
}

interface ActivityPoint {
  date: string;
  checkins: number;
  results: number;
}

interface StudentExerciseFeedback {
  id: string;
  updated_at: string;
  student_name: string;
  workout_title: string;
  original_name: string;
  substitute_name: string | null;
  note: string | null;
}

const ActivePill = () => (
  <div className="flex min-w-0 items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 md:px-2 md:py-0.5">
    <span className="h-1 w-1 shrink-0 rounded-full bg-primary md:h-1.5 md:w-1.5" />
    <span className="font-mono text-[6px] uppercase tracking-widest text-primary/80 md:text-[7px]">Active</span>
  </div>
);

const StatCard = ({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full min-w-0 max-w-full">
    <TrainerPanelCard
      compact
      accent={accent}
      className="h-full min-w-0 max-w-full !p-3 hover:border-primary/20 sm:!p-4 md:!px-3.5 md:!py-2.5 lg:!px-4 lg:!py-3"
    >
      <div
        className="grid min-h-[118px] grid-cols-2 grid-rows-[auto,1fr] gap-x-2 gap-y-1.5 sm:min-h-[128px] md:min-h-0 md:grid-cols-[auto,minmax(0,1fr),auto] md:grid-rows-1 md:items-center md:gap-2.5 md:gap-y-0 lg:gap-3"
      >
        <div className="col-start-1 row-start-1 self-start md:self-center">
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-1.5 md:p-1.5 lg:p-2">
            <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-foreground/55"} md:h-[15px] md:w-[15px] lg:h-4 lg:w-4`} />
          </div>
        </div>
        <div className="col-start-2 row-start-1 justify-self-end self-start md:hidden">
          <ActivePill />
        </div>
        <div className="col-span-2 row-start-2 min-w-0 self-end space-y-0.5 md:col-span-1 md:col-start-2 md:row-start-1 md:self-center">
          <p className="font-body text-2xl font-semibold tabular-nums leading-none tracking-tight text-foreground sm:text-3xl md:text-[1.35rem] md:leading-tight lg:text-2xl lg:leading-none xl:text-3xl">
            {value}
          </p>
          <p className="min-w-0 break-words font-mono text-[7px] uppercase leading-snug tracking-[0.18em] text-muted-foreground sm:text-[8px] sm:tracking-[0.22em] md:text-[6.5px] md:leading-tight md:tracking-[0.2em] lg:text-[7px] lg:tracking-[0.24em]">
            {label}
          </p>
        </div>
        <div className="col-start-3 row-start-1 hidden self-center md:flex">
          <ActivePill />
        </div>
      </div>
    </TrainerPanelCard>
  </motion.div>
);

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [stats, setStats] = useState({ students: 0, groups: 0, workouts: 0 });
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DayProgress[]>([]);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLinkCount, setPendingLinkCount] = useState(0);
  const [exerciseFeedback, setExerciseFeedback] = useState<StudentExerciseFeedback[]>([]);

  const refreshPendingLinkCount = useCallback(async (tid: string) => {
    const { count } = await supabase
      .from("athlete_link_requests")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", tid)
      .eq("status", "pending");
    setPendingLinkCount(count ?? 0);
  }, []);

  const fetchData = async (tid: string) => {
    try {
      await refreshPendingLinkCount(tid);

      const [{ count: sc }, { count: gc }, { count: wc }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("trainer_id", tid).eq("active", true),
        supabase.from("groups").select("*", { count: "exact", head: true }).eq("trainer_id", tid),
        supabase.from("workouts").select("*", { count: "exact", head: true }).eq("trainer_id", tid),
      ]);
      setStats({ students: sc || 0, groups: gc || 0, workouts: wc || 0 });

      const { data: wlogsForTrainer } = await supabase
        .from("workout_logs")
        .select("id, student_id, workouts!inner(id, title, trainer_id)")
        .eq("workouts.trainer_id", tid);

      const logMeta = new Map<string, { student_id: string; workout_title: string }>();
      wlogsForTrainer?.forEach((row) => {
        const wr = row.workouts as { title?: string } | { title?: string }[] | null;
        const title = Array.isArray(wr) ? wr[0]?.title : wr?.title;
        logMeta.set(row.id, { student_id: row.student_id, workout_title: title || "Treino" });
      });
      const trainerLogIds = wlogsForTrainer?.map((l) => l.id) || [];

      if (trainerLogIds.length > 0) {
        const { data: rawAdap } = await supabase
          .from("workout_exercise_adaptations")
          .select(
            "id, student_note, substitute_exercise_id, updated_at, workout_log_id, workout_exercises(exercise_id, exercises(name))"
          )
          .in("workout_log_id", trainerLogIds)
          .order("updated_at", { ascending: false })
          .limit(50);

        const filtered = (rawAdap || []).filter(
          (a) =>
            (a.student_note && a.student_note.trim().length > 0) || !!a.substitute_exercise_id
        );

        const uids = new Set<string>();
        const exIds = new Set<string>();
        filtered.forEach((a) => {
          const meta = logMeta.get(a.workout_log_id);
          if (meta) uids.add(meta.student_id);
          if (a.substitute_exercise_id) exIds.add(a.substitute_exercise_id);
        });
        const { data: stRows } = await supabase.from("students").select("id, user_id").in("id", [...uids]);
        const sMap = new Map(stRows?.map((s) => [s.id, s.user_id]) || []);
        const userIds = [...new Set([...sMap.values()] as string[])];
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", userIds);
        const nameByUser = new Map(profs?.map((p) => [p.user_id, p.name]) || []);
        let subExRows: { id: string; name: string }[] = [];
        if (exIds.size > 0) {
          const { data: srows } = await supabase
            .from("exercises")
            .select("id, name")
            .in("id", [...exIds]);
          subExRows = srows || [];
        }
        const subName = new Map(subExRows.map((e) => [e.id, e.name]));

        const items: StudentExerciseFeedback[] = filtered.slice(0, 20).map((a) => {
          const meta = logMeta.get(a.workout_log_id);
          const sid = meta?.student_id;
          const uid = sid ? sMap.get(sid) : undefined;
          const wex = a.workout_exercises as
            | { exercises: { name: string } | null }
            | null;
          const orig =
            wex && !Array.isArray(wex) && wex.exercises
              ? wex.exercises.name
              : "—";
          return {
            id: a.id,
            updated_at: a.updated_at,
            student_name: (uid && nameByUser.get(uid)) || "Atleta",
            workout_title: meta?.workout_title || "—",
            original_name: orig,
            substitute_name: a.substitute_exercise_id
              ? subName.get(a.substitute_exercise_id) || null
              : null,
            note: a.student_note,
          };
        });
        setExerciseFeedback(items);
      } else {
        setExerciseFeedback([]);
      }

      // Fetch inactive (pending) students
      const { data: inactiveStudents } = await supabase
        .from("students")
        .select("id, user_id, created_at")
        .eq("trainer_id", tid)
        .eq("active", false)
        .order("created_at", { ascending: false });

      if (inactiveStudents && inactiveStudents.length > 0) {
        const userIds = inactiveStudents.map((s) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        setPending(
          inactiveStudents.map((s) => ({
            id: s.id,
            user_id: s.user_id,
            name: profileMap.get(s.user_id)?.name || "Sem nome",
            email: profileMap.get(s.user_id)?.email || "",
            created_at: s.created_at,
          }))
        );
      } else {
        setPending([]);
      }

      // Fetch activity data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const { data: trainerStudents } = await supabase.from("students").select("id").eq("trainer_id", tid);
      const studentIds = trainerStudents?.map(s => s.id) || [];

      if (studentIds.length > 0) {
        const { data: logs } = await supabase
          .from("workout_logs")
          .select("id, completed_at")
          .in("student_id", studentIds)
          .gte("completed_at", sevenDaysAgo.toISOString());

        const logIds = logs?.map(l => l.id) || [];
        
        let exLogs: { created_at: string }[] = [];
        if (logIds.length > 0) {
          const { data: eLogs } = await supabase
            .from("exercise_logs")
            .select("created_at")
            .in("workout_log_id", logIds);
          exLogs = eLogs || [];
        }

        const activityPoints: ActivityPoint[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const displayDate = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
          
          const checkins = logs?.filter(l => l.completed_at.startsWith(dateStr)).length || 0;
          const results = exLogs?.filter(el => el.created_at.startsWith(dateStr)).length || 0;
          
          activityPoints.push({ date: displayDate, checkins, results });
        }
        setActivityData(activityPoints);
      }

      // Fetch daily progress
      const today = new Date().toISOString().split('T')[0];
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, title, is_group, group_id, student_id, groups(name)")
        .eq("trainer_id", tid)
        .eq("date", today);

      if (workouts && workouts.length > 0) {
        const groupIds = workouts.filter(w => w.is_group && w.group_id).map(w => w.group_id as string);
        const individualIds = workouts.filter(w => !w.is_group && w.student_id).map(w => w.student_id as string);

        const allStudentIds: string[] = [...individualIds];
        const groupMembersMap = new Map<string, string[]>();

        if (groupIds.length > 0) {
          const { data: gmembers } = await supabase.from("group_members").select("group_id, student_id").in("group_id", groupIds);
          gmembers?.forEach(gm => {
            if (!groupMembersMap.has(gm.group_id)) groupMembersMap.set(gm.group_id, []);
            groupMembersMap.get(gm.group_id)!.push(gm.student_id);
            if (!allStudentIds.includes(gm.student_id)) allStudentIds.push(gm.student_id);
          });
        }

        const { data: stds } = await supabase.from("students").select("id, user_id").in("id", allStudentIds);
        const userIds = stds?.map(s => s.user_id) || [];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);

        const profileMap = new Map<string, string>();
        profiles?.forEach(p => profileMap.set(p.user_id, p.name));

        const studentNameMap = new Map<string, string>();
        stds?.forEach(s => studentNameMap.set(s.id, profileMap.get(s.user_id) || "Sem nome"));

        const workoutIds = workouts.map(w => w.id);
        const { data: logs } = await supabase.from("workout_logs").select("student_id, workout_id").in("workout_id", workoutIds);

        const logMap = new Map<string, Set<string>>();
        logs?.forEach(l => {
          if (!logMap.has(l.workout_id)) logMap.set(l.workout_id, new Set());
          logMap.get(l.workout_id)!.add(l.student_id);
        });

        const progressData: DayProgress[] = workouts.map(w => {
          let targetStudents: string[] = [];
          if (w.is_group && w.group_id) {
            targetStudents = groupMembersMap.get(w.group_id) || [];
          } else if (!w.is_group && w.student_id) {
            targetStudents = [w.student_id];
          }

          const completedCount = targetStudents.filter(id => logMap.get(w.id)?.has(id)).length;
          const stDetails = targetStudents.map(id => ({
            id,
            name: studentNameMap.get(id) || "Desconhecido",
            completed: logMap.get(w.id)?.has(id) || false
          }));

          const groupsData = w.groups as any;
          const groupName = Array.isArray(groupsData) ? groupsData[0]?.name : groupsData?.name || null;

          return {
            workout_id: w.id,
            title: w.title,
            group_name: groupName,
            total_students: targetStudents.length,
            completed_students: completedCount,
            students: stDetails
          };
        });

        setDailyProgress(progressData);
      }
    } catch (error) {
      console.error("Error fetching trainer dashboard data:", error);
      toast.error("Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const { data: trainer, error } = await supabase.from("trainers").select("id").eq("user_id", user.id).maybeSingle();
        if (error) throw error;
        if (!trainer) { 
          setLoading(false); 
          return; 
        }
        setTrainerId(trainer.id);
        fetchData(trainer.id);
      } catch (error) {
        console.error("Error initializing trainer dashboard:", error);
        setLoading(false);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!trainerId) return;
    const channel = supabase
      .channel(`trainer-link-requests-${trainerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "athlete_link_requests",
          filter: `trainer_id=eq.${trainerId}`,
        },
        () => {
          refreshPendingLinkCount(trainerId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId, refreshPendingLinkCount]);

  const handleApprove = async (studentId: string) => {
    await supabase.from("students").update({ active: true }).eq("id", studentId);
    toast.success("Atleta aprovado!");
    if (trainerId) fetchData(trainerId);
  };

  const handleReject = async (studentId: string) => {
    await supabase.from("students").delete().eq("id", studentId);
    toast.success("Solicitação recusada");
    if (trainerId) fetchData(trainerId);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-8 overflow-x-hidden pb-12 pt-4 sm:space-y-10 sm:pt-6">
      <div className="flex min-w-0 max-w-full flex-col gap-4 rounded-[28px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-8">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            <Activity className="h-3 w-3 shrink-0" />
            Dashboard
          </div>
          <h1 className="text-5xl font-medium leading-[0.92] tracking-[-0.06em] text-foreground sm:text-6xl md:text-[4.5rem]">
            Monitor de <span className="text-primary">performance</span>
          </h1>
        </div>
        
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/trainer/treinos")}
            className="btn-action flex h-12 min-w-0 flex-1 items-center justify-center gap-2 px-4 sm:min-w-0 sm:flex-initial sm:px-6"
          >
            <Activity className="h-4 w-4 shrink-0" />
            <span className="truncate">Novo treino</span>
          </button>
          <NavLink
            to="/trainer/atletas"
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/15 hover:text-primary sm:min-w-0 sm:flex-initial sm:px-6"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">Ver atletas</span>
          </NavLink>
        </div>
      </div>

      {pendingLinkCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="group">
          <TrainerPanelCard accent flush>
            <NavLink
              to="/trainer/atletas"
              className="flex items-center justify-between gap-4 p-6 transition-colors hover:bg-primary/[0.04] md:p-8"
            >
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <Inbox className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Ação requerida</div>
                  <h3 className="font-body text-xl font-normal leading-snug tracking-tight text-foreground md:text-2xl">
                    {pendingLinkCount === 1 ? "Nova solicitação de acesso" : `${pendingLinkCount} solicitações pendentes`}
                  </h3>
                </div>
              </div>
              <Activity className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
            </NavLink>
          </TrainerPanelCard>
        </motion.div>
      )}

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 md:gap-3 lg:gap-4">
        <StatCard label="Atletas Ativos" value={stats.students} icon={Users} />
        <StatCard label="Grupos Operacionais" value={stats.groups} icon={Layers} />
        <StatCard label="Treinos criados" value={stats.workouts} icon={Dumbbell} accent />
      </div>

      {exerciseFeedback.length > 0 && (
        <TrainerPanelCard
          eyebrow="Feedback"
          title="Notas e adaptações dos atletas"
          subtitle="Substituições de exercício e observações deixadas durante os treinos."
        >
          <ul className="max-h-[min(420px,50vh)] space-y-4 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar sm:max-h-[min(480px,45vh)]">
            {exerciseFeedback.map((item) => (
              <li key={item.id} className="min-w-0 max-w-full rounded-xl border border-border bg-background p-4 md:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words font-body text-sm font-medium text-foreground">
                      {item.student_name}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-foreground/35">
                    {new Date(item.updated_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 min-w-0 break-words font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.workout_title}
                </p>
                <div className="mt-3 min-w-0 space-y-1 break-words text-sm text-foreground/80">
                  <p>
                    <span className="text-foreground/45">Exercício prescrito: </span>
                    {item.original_name}
                  </p>
                  {item.substitute_name && (
                    <p>
                      <span className="text-foreground/45">Executado como: </span>
                      {item.substitute_name}
                    </p>
                  )}
                  {item.note && item.note.trim() && (
                    <p className="border-l-2 border-primary/40 pl-3 font-body italic text-foreground/90">
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </TrainerPanelCard>
      )}

      <div className="grid min-w-0 max-w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex h-full min-h-0 w-full min-w-0 max-w-full lg:col-span-8">
          <TrainerPanelCard
          eyebrow="Métricas"
          title="Fluxo de rendimento"
            subtitle="Visão semanal de check-ins e resultados postados."
            aside={<TrainerPanelCardMedia src={heroImage} alt="" />}
            features={["Dados consolidados dos seus atletas", "Leitura rápida da semana"]}
            className="h-full min-h-0 w-full max-w-full flex-1 flex-col"
          >
            <div className="flex items-center justify-end pb-4 lg:hidden">
              <div className="rounded-xl border border-border/80 bg-background/70 p-3">
                <TrendingUp className="h-6 w-6 text-foreground/45" />
              </div>
            </div>
            <div className="flex min-h-[min(240px,35vh)] w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden lg:min-h-0">
              {!loading && activityData.length > 0 && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <PremiumActivityChart data={activityData} title="" />
                </div>
              )}
            </div>
          </TrainerPanelCard>
        </div>

        <div className="flex h-full min-h-0 w-full min-w-0 max-w-full lg:col-span-4">
          <TrainerPanelCard
            className="flex h-full min-h-0 w-full flex-1 flex-col"
            eyebrow="Hoje"
            title="Check-ins hoje"
            subtitle="Protocolos do dia e progresso por atleta."
          >
          <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col space-y-6">
          <div className="min-h-0 min-w-0 max-w-full flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar sm:pr-2">
            {dailyProgress.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                <BarChart3 className="w-10 h-10" />
                <p className="text-sm text-muted-foreground leading-relaxed">Nenhum protocolo ativo para hoje.</p>
              </div>
            ) : (
              dailyProgress.map((p) => (
                <div key={p.workout_id} className="rounded-2xl border border-border/80 bg-background/60 p-5 space-y-3 transition-all group hover:border-primary/15">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-body text-base font-normal tracking-tight text-foreground truncate">{p.title}</h4>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">{p.group_name || "Individual"}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-body text-xl text-primary font-semibold tabular-nums">{p.completed_students}/{p.total_students}</span>
                    </div>
                  </div>
                  <div className="h-1 w-full max-w-full overflow-hidden rounded-full bg-primary/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          p.total_students > 0
                            ? (p.completed_students / p.total_students) * 100
                            : 0
                        }%`,
                      }}
                      className="h-full max-w-full bg-primary"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <NavLink
            to="/trainer/treinos"
            className="w-full rounded-full border border-border bg-transparent py-3.5 text-center text-sm font-medium text-foreground/75 transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
          >
            Ver todos os protocolos
          </NavLink>
          </div>
          </TrainerPanelCard>
        </div>
      </div>

      <div className="min-w-0 max-w-full space-y-6 sm:space-y-8">
        <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </div>
            <h2 className="font-body text-2xl font-normal tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Status dos protocolos
            </h2>
          </div>
          <div className="flex w-fit max-w-full shrink-0 items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2">
            <div className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(90,26,169,0.28)]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary/70">
              Atualização ao vivo
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-border/80 bg-background/70" />
            ))}
          </div>
        ) : dailyProgress.length === 0 ? (
          <TrainerPanelCard title="Sem protocolo hoje" subtitle="Assim que houver treinos agendados para a data atual, eles aparecem aqui.">
            <div className="flex flex-col items-center justify-center gap-6 py-10 text-center md:py-16">
              <Activity className="h-16 w-16 text-foreground/15" />
              <div className="space-y-2">
                <p className="font-body text-2xl font-normal tracking-tight text-foreground/50">Nenhum protocolo ativo hoje</p>
                <p className="text-sm text-muted-foreground italic">Aguardando dados de performance.</p>
              </div>
            </div>
          </TrainerPanelCard>
        ) : (
          <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dailyProgress.map((dp, i) => {
              const perc = dp.total_students === 0 ? 0 : Math.round((dp.completed_students / dp.total_students) * 100);
              const isComplete = perc === 100 && dp.total_students > 0;

              return (
                <motion.div
                  key={dp.workout_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group h-full flex flex-col"
                >
                  <TrainerPanelCard
                    compact
                    accent={isComplete}
                    className={`h-full transition-all duration-500 ${isComplete ? "shadow-[0_10px_30px_rgba(90,26,169,0.09)]" : ""}`}
                  >
                    <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <div className="space-y-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                          <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? "bg-primary shadow-[0_0_8px_rgba(90,26,169,0.6)]" : "bg-foreground/20"}`} />
                          {dp.group_name || "Individual"}
                        </div>
                        <h4 className="font-body text-xl md:text-2xl font-normal tracking-tight text-foreground leading-snug truncate">{dp.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className={`font-body text-4xl tracking-tight leading-none font-semibold tabular-nums ${isComplete ? "text-primary" : "text-foreground/80"}`}>{perc}%</div>
                        <div className="mt-2 text-xs text-muted-foreground">{dp.completed_students}/{dp.total_students} atletas</div>
                      </div>
                    </div>

                    <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${isComplete ? "bg-primary" : "bg-foreground/25"}`}
                        style={{ width: `${perc}%` }}
                      />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-48">
                      {dp.students.map((st) => (
                        <div key={st.id} className={`flex min-w-0 max-w-full items-center justify-between gap-2 border px-4 py-3 font-mono text-[9px] uppercase tracking-wider transition-colors sm:px-5 ${st.completed ? "border-primary/20 bg-primary/10 font-bold text-foreground" : "border-border/80 bg-background/55 text-foreground/35"}`}>
                          <span className="min-w-0 truncate">{st.name}</span>
                          {st.completed ? (
                            <Activity className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-foreground/10" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-8 flex min-w-0 max-w-full flex-col gap-2 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="min-w-0 break-all text-xs text-muted-foreground sm:break-normal">
                        ID: {dp.workout_id.substring(0, 8).toUpperCase()}…
                      </span>
                      <NavLink
                        to="/trainer/treinos"
                        className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-foreground"
                      >
                        Ver detalhes
                      </NavLink>
                    </div>
                  </div>
                  </TrainerPanelCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default TrainerDashboard;
