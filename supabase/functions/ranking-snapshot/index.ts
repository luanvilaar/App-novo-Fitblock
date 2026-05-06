import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the PREVIOUS week's ranking (Mon-Fri that just ended)
    // This runs on Monday 00:05 São Paulo time, so "last week" is the one that ended on Friday
    const now = new Date();
    const spFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour12: false,
    });
    const parts = spFormatter.formatToParts(now);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
    const spYear = Number(get("year"));
    const spMonth = Number(get("month")) - 1;
    const spDay = Number(get("day"));

    // Today should be Monday; previous Monday = 7 days ago
    const prevMonday = new Date(spYear, spMonth, spDay - 7);
    const prevFriday = new Date(prevMonday.getFullYear(), prevMonday.getMonth(), prevMonday.getDate() + 4);

    const weekStart = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, '0')}-${String(prevMonday.getDate()).padStart(2, '0')}`;
    const weekEnd = `${prevFriday.getFullYear()}-${String(prevFriday.getMonth() + 1).padStart(2, '0')}-${String(prevFriday.getDate()).padStart(2, '0')}`;

    // Check if snapshot already exists for this week
    const { data: existing } = await supabase
      .from("ranking_history")
      .select("id")
      .eq("week_start", weekStart)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Snapshot already exists for this week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call public-ranking to get current data (it will use the current week window)
    // Instead, we compute ranking for the previous week inline
    const mondayStart = new Date(`${weekStart}T00:00:00-03:00`);
    const fridayEnd = new Date(`${weekEnd}T23:59:59-03:00`);

    // Fetch workout logs for previous week
    const { data: wLogs } = await supabase
      .from("workout_logs")
      .select("id, student_id, completed_at, workout_id")
      .gte("completed_at", mondayStart.toISOString())
      .lte("completed_at", fridayEnd.toISOString())
      .order("completed_at", { ascending: true });

    if (!wLogs || wLogs.length === 0) {
      return new Response(JSON.stringify({ message: "No data for previous week", weekStart, weekEnd }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reuse same ranking logic (simplified inline)
    const workoutIds = [...new Set(wLogs.map(l => l.workout_id))];
    const { data: refMetcons } = await supabase
      .from("workout_metcons")
      .select("id, workout_id, metcon_type")
      .in("workout_id", workoutIds)
      .eq("is_ranking_reference", true);

    if (!refMetcons || refMetcons.length === 0) {
      return new Response(JSON.stringify({ message: "No ranking metcons for previous week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workoutRefMetcon = new Map(refMetcons.map(m => [m.workout_id, { metcon_id: m.id, metcon_type: m.metcon_type }]));
    const rankedWorkoutIds = workoutIds.filter(wid => workoutRefMetcon.has(wid));

    const { data: workouts } = await supabase.from("workouts").select("id, group_id, is_group").in("id", rankedWorkoutIds);
    const workoutGroupMap = new Map<string, string>();
    const allGroupIds = new Set<string>();
    for (const w of (workouts || [])) {
      if (w.is_group && w.group_id) { workoutGroupMap.set(w.id, w.group_id); allGroupIds.add(w.group_id); }
    }

    let allGroupMembers: { student_id: string; group_id: string }[] = [];
    if (allGroupIds.size > 0) {
      const { data } = await supabase.from("group_members").select("student_id, group_id").in("group_id", [...allGroupIds]);
      allGroupMembers = data || [];
    }

    const groupMembersMap = new Map<string, Set<string>>();
    for (const m of allGroupMembers) {
      if (!groupMembersMap.has(m.group_id)) groupMembersMap.set(m.group_id, new Set());
      groupMembersMap.get(m.group_id)!.add(m.student_id);
    }

    const allStudentIds = new Set<string>();
    for (const members of groupMembersMap.values()) for (const sid of members) allStudentIds.add(sid);
    for (const l of wLogs) allStudentIds.add(l.student_id);
    const studentIdsArr = [...allStudentIds];

    const { data: allScores } = await supabase.from("metcon_scores").select("metcon_id, student_id, score_value").in("metcon_id", refMetcons.map(m => m.id)).in("student_id", studentIdsArr);
    const { data: studentsData } = await supabase.from("students").select("id, user_id").in("id", studentIdsArr);
    const userIds = studentsData?.map(s => s.user_id) || [];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds);
    const { data: groups } = await supabase.from("groups").select("id, name").in("id", allGroupIds.size > 0 ? [...allGroupIds] : ["none"]);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const studentUserMap = new Map(studentsData?.map(s => [s.id, s.user_id]) || []);
    const groupMap = new Map(groups?.map(g => [g.id, g.name]) || []);
    const studentGroupMap = new Map<string, string>();
    for (const m of allGroupMembers) { if (!studentGroupMap.has(m.student_id)) studentGroupMap.set(m.student_id, m.group_id); }

    const scoresByMetcon = new Map<string, { student_id: string; score_value: string }[]>();
    for (const s of (allScores || [])) {
      if (!scoresByMetcon.has(s.metcon_id)) scoresByMetcon.set(s.metcon_id, []);
      scoresByMetcon.get(s.metcon_id)!.push(s);
    }

    function parseScore(raw: string): number {
      const trimmed = raw.trim();
      if (trimmed.includes(":")) {
        const pts = trimmed.split(":").map(Number);
        if (pts.length === 2) return pts[0] * 60 + pts[1];
        if (pts.length === 3) return pts[0] * 3600 + pts[1] * 60 + pts[2];
      }
      return Number(trimmed) || 0;
    }

    const workoutPlacements = new Map<string, Map<string, { position: number; score_raw: string; points: number }>>();
    for (const wid of rankedWorkoutIds) {
      const ref = workoutRefMetcon.get(wid)!;
      const scores = scoresByMetcon.get(ref.metcon_id) || [];
      const groupId = workoutGroupMap.get(wid);
      let workoutAthletes: Set<string>;
      if (groupId && groupMembersMap.has(groupId)) { workoutAthletes = groupMembersMap.get(groupId)!; }
      else { workoutAthletes = new Set(); for (const l of wLogs) { if (l.workout_id === wid) workoutAthletes.add(l.student_id); } }
      const totalAthletes = workoutAthletes.size;
      if (totalAthletes === 0) continue;
      const validScores = scores.filter(s => workoutAthletes.has(s.student_id));
      const parsed = validScores.map(s => ({ student_id: s.student_id, score_raw: s.score_value, numeric: parseScore(s.score_value) }));
      const lowerIsBetter = ref.metcon_type === "FOR TIME";
      parsed.sort((a, b) => lowerIsBetter ? a.numeric - b.numeric : b.numeric - a.numeric);
      const placements = new Map<string, { position: number; score_raw: string; points: number }>();
      let pos = 1;
      for (let i = 0; i < parsed.length; i++) {
        const assignedPos = (i > 0 && parsed[i].numeric === parsed[i - 1].numeric) ? placements.get(parsed[i - 1].student_id)!.position : pos;
        placements.set(parsed[i].student_id, { position: assignedPos, score_raw: parsed[i].score_raw, points: assignedPos });
        pos++;
      }
      const submittedIds = new Set(validScores.map(s => s.student_id));
      for (const sid of workoutAthletes) { if (!submittedIds.has(sid)) placements.set(sid, { position: totalAthletes, score_raw: "—", points: totalAthletes }); }
      workoutPlacements.set(wid, placements);
    }

    const athleteData = new Map<string, { workout_details: any[]; total_points: number; best_position: number; }>();
    for (const sid of allStudentIds) {
      const details: any[] = [];
      for (const wid of rankedWorkoutIds) {
        const p = workoutPlacements.get(wid)?.get(sid);
        if (p) details.push({ workout_id: wid, ...p });
      }
      if (details.length === 0) continue;
      athleteData.set(sid, {
        workout_details: details,
        total_points: details.reduce((sum, d) => sum + d.points, 0),
        best_position: Math.min(...details.map(d => d.position)),
      });
    }

    const ranking = [...athleteData.entries()]
      .map(([sid, data]) => {
        const profile = profileMap.get(studentUserMap.get(sid) || "");
        const gid = studentGroupMap.get(sid);
        return {
          student_id: sid,
          name: profile?.name || "Atleta",
          avatar_url: profile?.avatar_url || null,
          group_name: gid ? groupMap.get(gid) || "" : "",
          total_points: data.total_points,
          workout_details: data.workout_details,
          best_position: data.best_position,
        };
      })
      .sort((a, b) => a.total_points !== b.total_points ? a.total_points - b.total_points : a.best_position - b.best_position);

    // Insert snapshot rows
    const rows = ranking.slice(0, 20).map((r, i) => ({
      week_start: weekStart,
      week_end: weekEnd,
      student_id: r.student_id,
      name: r.name,
      avatar_url: r.avatar_url,
      group_name: r.group_name,
      total_points: r.total_points,
      position: i + 1,
      workout_details: r.workout_details,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("ranking_history").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ message: "Snapshot saved", count: rows.length, weekStart, weekEnd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
