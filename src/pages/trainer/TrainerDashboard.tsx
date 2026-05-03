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
  ChevronRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PremiumActivityChart from "@/components/PremiumActivityChart";
import { TrainerPanelCard, TrainerPanelCardMedia } from "@/components/trainer/TrainerPanelCard";
import { cn } from "@/lib/utils";
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
  <div className="flex min-w-0 items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5">
    <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
    <span className="font-mono text-[7px] uppercase tracking-[1.4px] text-primary">Active</span>
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "light",
  helper,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "light" | "dark";
  helper: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }} 
    className="h-full min-w-0"
  >
    <div
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-[2.25rem] border p-7 transition-all duration-300",
        tone === "dark"
          ? "border-black bg-black text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]"
          : "border-black/10 bg-[#f2f2f0] text-black shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:border-black/20 hover:shadow-[0_14px_30px_rgba(0,0,0,0.12)]",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-all",
            tone === "dark"
              ? "bg-white/10 text-white"
              : "bg-white text-black/65 ring-1 ring-black/8 group-hover:bg-black group-hover:text-white",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div className={cn("h-2.5 w-2.5 rounded-full", tone === "dark" ? "bg-white/35" : "bg-black/20")} />
      </div>
      
      <div className="space-y-2 pt-10">
        <p
          className={cn(
            "font-sans text-5xl font-black tracking-tighter tabular-nums leading-none lg:text-6xl",
            tone === "dark" ? "text-white" : "text-black",
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            "font-mono text-[9px] font-black uppercase tracking-[0.24em]",
            tone === "dark" ? "text-white/55" : "text-black/45",
          )}
        >
          {label}
        </p>
        <p className={cn("max-w-[18ch] text-sm leading-snug", tone === "dark" ? "text-white/72" : "text-black/55")}>
          {helper}
        </p>
      </div>
    </div>
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

          const groupsData = w.groups;
          const groupName =
            typeof groupsData === "object" && groupsData !== null && "name" in groupsData
              ? (groupsData as { name?: string }).name || null
              : null;

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
    <div className="space-y-24">
      <header className="flex flex-col gap-8 rounded-[2.5rem] border border-black/6 bg-[#f6f5f2] px-8 py-8 shadow-[0_14px_36px_rgba(0,0,0,0.06)] lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="max-w-3xl space-y-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.26em] text-black/28">Coach Workspace</p>
          <h1 className="font-sans text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-6xl">
            Performance.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-black/55 sm:text-base">
            Visão rápida do que precisa de atenção agora: atletas ativos, comunidades em andamento e protocolos publicados.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/trainer/treinos")}
            className="h-14 rounded-full bg-black px-7 text-sm font-black uppercase tracking-[0.18em] text-white transition-all active:scale-95 shadow-[0_14px_32px_rgba(0,0,0,0.18)]"
          >
            Novo protocolo
          </button>
          <NavLink to="/trainer/atletas">
            <button className="h-14 rounded-full border border-black/10 bg-white px-7 text-sm font-black uppercase tracking-[0.18em] text-black/55 transition-all hover:border-black/25 hover:bg-black hover:text-white">
              Atletas
            </button>
          </NavLink>
        </div>
      </header>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <StatCard
          label="Atletas Ativos"
          value={stats.students}
          icon={Users}
          tone="dark"
          helper="Atletas em acompanhamento com acesso e vínculo ativos."
        />
        <StatCard
          label="Comunidades"
          value={stats.groups}
          icon={Layers}
          helper="Grupos atualmente organizados no seu workspace."
        />
        <StatCard
          label="Protocolos"
          value={stats.workouts}
          icon={Dumbbell}
          helper="Protocolos publicados e prontos para execução."
        />
      </div>

      {pendingLinkCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <NavLink
            to="/trainer/atletas"
            className="flex items-center justify-between rounded-[3rem] bg-black p-10 text-white shadow-2xl transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black">
                <Inbox className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ação requerida</p>
                <h3 className="font-sans text-3xl font-black tracking-tight">
                  {pendingLinkCount === 1 ? "Nova solicitação" : `${pendingLinkCount} solicitações de vínculo`}
                </h3>
              </div>
            </div>
            <ChevronRight className="h-10 w-10 text-white/40" strokeWidth={3} />
          </NavLink>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-24 lg:grid-cols-12">
        {/* ACTIVITY CHART */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center gap-6">
            <h2 className="font-sans text-3xl font-black tracking-tight text-black">Fluxo de rendimento.</h2>
            <div className="h-px flex-1 bg-black/5" />
          </div>
          <div className="rounded-[3rem] bg-white p-10 ring-1 ring-black/5 shadow-sm">
            <div className="h-[400px] w-full">
              {!loading && activityData.length > 0 && (
                <PremiumActivityChart data={activityData} title="" />
              )}
            </div>
          </div>
        </div>

        {/* DAILY PROGRESS */}
        <div className="lg:col-span-4 space-y-12">
          <div className="flex items-center gap-6">
            <h2 className="font-sans text-3xl font-black tracking-tight text-black">Check-ins.</h2>
            <div className="h-px flex-1 bg-black/5" />
          </div>
          <div className="rounded-[3rem] bg-white p-10 ring-1 ring-black/5 shadow-sm">
            <div className="space-y-10">
              {dailyProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-black/10">
                  <BarChart3 className="mb-6 h-12 w-12" />
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest">Sem atividade hoje</p>
                </div>
              ) : (
                dailyProgress.slice(0, 5).map((p) => (
                  <div key={p.workout_id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-sans text-lg font-black text-black">{p.title.toLowerCase()}</p>
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">{p.group_name || "Individual"}</p>
                      </div>
                      <span className="font-sans text-sm font-black text-black">{p.completed_students}/{p.total_students}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f3f3]">
                      <div
                        className="h-full bg-black transition-all duration-1000"
                        style={{ width: `${p.total_students > 0 ? (p.completed_students / p.total_students) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
              <NavLink to="/trainer/treinos" className="block pt-6">
                <button className="w-full h-14 rounded-full border border-black/5 bg-[#f3f3f3] text-[10px] font-black uppercase tracking-widest text-black/40 transition-all hover:bg-black hover:text-white">
                  Ver programação completa
                </button>
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* PROTOCOL STATUS */}
      <div className="space-y-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-sans text-4xl font-black tracking-tighter text-black">Status dos protocolos.</h2>
          <div className="flex items-center gap-3 rounded-full bg-[#f3f3f3] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black ring-1 ring-black/5">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.4)]" />
            Live Update
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-[3rem] bg-[#f3f3f3]" />
            ))}
          </div>
        ) : dailyProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center rounded-[3rem] bg-[#f3f3f3] ring-1 ring-black/5">
            <Activity className="mb-8 h-20 w-20 text-black/10" />
            <p className="text-xl font-black text-black/20 uppercase tracking-tighter">Nenhum protocolo ativo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {dailyProgress.map((dp, i) => {
              const perc = dp.total_students === 0 ? 0 : Math.round((dp.completed_students / dp.total_students) * 100);
              return (
                <motion.div
                  key={dp.workout_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col rounded-[3rem] bg-white p-10 ring-1 ring-black/5 transition-all hover:ring-black/10 shadow-sm"
                >
                  <div className="mb-12 flex items-start justify-between">
                    <div className="min-w-0 space-y-2">
                      <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">
                        {dp.group_name || "Individual"}
                      </p>
                      <h4 className="truncate font-sans text-3xl font-black tracking-tighter text-black">{dp.title.toLowerCase()}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-5xl font-black text-black">{perc}%</p>
                    </div>
                  </div>

                  <div className="mb-12 h-3 w-full overflow-hidden rounded-full bg-[#f3f3f3]">
                    <div
                      className="h-full bg-black transition-all duration-1000"
                      style={{ width: `${perc}%` }}
                    />
                  </div>

                  <div className="max-h-64 flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {dp.students.map((st) => (
                      <div
                        key={st.id}
                        className={cn(
                          "flex items-center justify-between rounded-2xl p-5 text-[10px] font-black uppercase tracking-widest transition-all",
                          st.completed 
                            ? "bg-black text-white shadow-lg" 
                            : "bg-[#f3f3f3] text-black/20"
                        )}
                      >
                        <span className="truncate">{st.name.toLowerCase()}</span>
                        {st.completed && <Check className="h-4 w-4" strokeWidth={4} />}
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 border-t border-black/5 pt-10">
                    <NavLink
                      to="/trainer/treinos"
                      className="flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-black hover:opacity-60 transition-opacity"
                    >
                      Detalhes do protocolo
                      <ChevronRight className="ml-2 h-4 w-4" strokeWidth={4} />
                    </NavLink>
                  </div>
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
