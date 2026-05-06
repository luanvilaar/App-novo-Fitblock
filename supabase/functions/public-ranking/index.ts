import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RankingGender = "all" | "male" | "female";
type RankingAgeRange = "all" | "sub18" | "18_34" | "35_39" | "40_plus";

interface RankingRequest {
  boxSlug?: string | null;
  groupId?: string | null;
  gender?: RankingGender | null;
  ageRange?: RankingAgeRange | null;
  limit?: number | null;
}

/** Parse a score_value string into a comparable number. */
function parseScore(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number(trimmed) || 0;
}

/** Get current Monday 00:00 and Friday 23:59 in America/Sao_Paulo */
function getWeekWindow(): { mondayStart: Date; fridayEnd: Date; weekLabel: string; monday: Date } {
  const now = new Date();
  const spFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = spFormatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const spYear = Number(get("year"));
  const spMonth = Number(get("month")) - 1;
  const spDay = Number(get("day"));
  const spDow = new Date(spYear, spMonth, spDay).getDay();

  let mondayOffset: number;
  if (spDow === 0) mondayOffset = -6;
  else if (spDow === 6) mondayOffset = -5;
  else mondayOffset = 1 - spDow;

  const monday = new Date(spYear, spMonth, spDay + mondayOffset);
  const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);

  const mondayStart = new Date(`${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}T00:00:00-03:00`);
  const fridayEnd = new Date(`${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}T23:59:59-03:00`);

  const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const weekNum = Math.ceil((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / (7 * 86400000)) + 1;
  const weekLabel = `Semana ${weekNum} – ${fmtDate(monday)} a ${fmtDate(friday)}`;

  return { mondayStart, fridayEnd, weekLabel, monday };
}

function normalizeGender(raw?: string | null): "male" | "female" | null {
  if (!raw) return null;
  const value = raw.toLowerCase().trim();
  if (value === "male" || value === "masculino" || value === "m") return "male";
  if (value === "female" || value === "feminino" || value === "f") return "female";
  return null;
}

function calculateAge(birthDate: string): number | null {
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
}

function ageMatchesRange(age: number, range: RankingAgeRange): boolean {
  if (range === "sub18") return age < 18;
  if (range === "18_34") return age >= 18 && age <= 34;
  if (range === "35_39") return age >= 35 && age <= 39;
  if (range === "40_plus") return age >= 40;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: RankingRequest = {};
    if (req.method !== "GET") {
      try { payload = (await req.json()) as RankingRequest; } catch { payload = {}; }
    }

    const selectedGender: RankingGender = payload.gender ?? "all";
    const selectedAgeRange: RankingAgeRange = payload.ageRange ?? "all";
    const selectedLimit = Math.max(1, Math.min(Number(payload.limit ?? 50), 200));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Resolve box ---
    let activeBoxId: string | null = null;
    let activeBoxSlug = payload.boxSlug?.trim() || null;

    if (activeBoxSlug) {
      const { data: explicitBox } = await supabase
        .from("boxes")
        .select("id, slug")
        .eq("slug", activeBoxSlug)
        .maybeSingle();

      if (!explicitBox) {
        return new Response(JSON.stringify({ error: "boxSlug invalido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      activeBoxId = explicitBox.id;
      activeBoxSlug = explicitBox.slug;
    } else {
      // Default to fitblock-training
      const { data: defaultBox } = await supabase
        .from("boxes")
        .select("id, slug")
        .eq("slug", "fitblock-training")
        .maybeSingle();
      if (defaultBox) {
        activeBoxId = defaultBox.id;
        activeBoxSlug = defaultBox.slug;
      }
    }

    // --- Find the athletes linked to this box ---
    let boxAthleteIds = new Set<string>();
    
    if (activeBoxId) {
      // Primary filter: Athletes explicitly assigned to this box
      const { data: studentsInBox } = await supabase
        .from("students")
        .select("id")
        .eq("box_id", activeBoxId);
      
      if (studentsInBox) {
        studentsInBox.forEach(s => boxAthleteIds.add(s.id));
      }

      // Secondary (Legacy) filter: Athletes in groups belonging to this box
      // This ensures transition is smooth for anyone not yet backfilled
      const { data: boxGroups } = await supabase
        .from("groups")
        .select("id")
        .eq("box_id", activeBoxId);
      
      if (boxGroups && boxGroups.length > 0) {
        const groupIds = boxGroups.map(g => g.id);
        const { data: members } = await supabase
          .from("group_members")
          .select("student_id")
          .in("group_id", groupIds);
        
        if (members) {
          members.forEach(m => boxAthleteIds.add(m.student_id));
        }
      }
    }

    // If a specific groupId is requested, further restrict the list
    if (payload.groupId) {
      const { data: specificGroupMembers } = await supabase
        .from("group_members")
        .select("student_id")
        .eq("group_id", payload.groupId);
      
      if (specificGroupMembers) {
        const specificIds = new Set(specificGroupMembers.map(m => m.student_id));
        // Intersection: Only those who are in both the box AND the specific group
        boxAthleteIds = new Set([...boxAthleteIds].filter(id => specificIds.has(id)));
      }
    }

    // If no athletes found, return empty ranking
    if (boxAthleteIds.size === 0) {
      const { weekLabel } = getWeekWindow();
      return new Response(JSON.stringify({ ranking: [], weekLabel, boxSlug: activeBoxSlug }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mondayStart, fridayEnd, weekLabel, monday } = getWeekWindow();

    // 1. Get workout logs within Mon-Fri window for these athletes
    const { data: wLogs } = await supabase
      .from("workout_logs")
      .select("id, student_id, completed_at, workout_id")
      .in("student_id", [...boxAthleteIds])
      .gte("completed_at", mondayStart.toISOString())
      .lte("completed_at", fridayEnd.toISOString())
      .order("completed_at", { ascending: true });

    const workoutIds = [...new Set((wLogs || []).map(l => l.workout_id))];

    // 2. Get ranking-reference metcons
    const { data: refMetcons } = await supabase
      .from("workout_metcons")
      .select("id, workout_id, metcon_type")
      .in("workout_id", workoutIds.length > 0 ? workoutIds : ["none"])
      .eq("is_ranking_reference", true);

    const workoutRefMetcon = new Map<string, { metcon_id: string; metcon_type: string }>();
    for (const m of (refMetcons || [])) {
      workoutRefMetcon.set(m.workout_id, { metcon_id: m.id, metcon_type: m.metcon_type });
    }
    const rankedWorkoutIds = workoutIds.filter(wid => workoutRefMetcon.has(wid));

    // 3. Get workout details for date mapping
    const { data: workouts } = await supabase
      .from("workouts")
      .select("id, group_id, is_group, date")
      .in("id", rankedWorkoutIds.length > 0 ? rankedWorkoutIds : ["none"]);

    const workoutDateMap = new Map<string, string>(); 
    for (const w of (workouts || [])) {
      if (w.date) workoutDateMap.set(w.id, w.date);
    }

    // Build a map of workout_id -> day index (0=Mon, 1=Tue, ..., 4=Fri)
    const mondayDateStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    function getDayIndex(workoutDate: string): number {
      try {
        const wDate = new Date(workoutDate + "T12:00:00");
        const mDate = new Date(mondayDateStr + "T12:00:00");
        const diff = Math.round((wDate.getTime() - mDate.getTime()) / 86400000);
        return Math.max(0, Math.min(4, diff));
      } catch {
        return 0;
      }
    }

    // 4. Get profile demographics for filtering
    const { data: students } = await supabase
      .from("students")
      .select("id, user_id")
      .in("id", [...boxAthleteIds]);
    
    const studentUserMap = new Map(students?.map(s => [s.id, s.user_id]) || []);
    const userIds = [...new Set(students?.map(s => s.user_id) || [])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url, gender, birth_date")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Filter eligible athletes by gender/age
    const eligibleAthleteIds = new Set<string>();
    for (const sid of boxAthleteIds) {
      const userId = studentUserMap.get(sid);
      if (!userId) continue;
      const profile = profileMap.get(userId);

      if (selectedGender !== "all") {
        const normalized = normalizeGender(profile?.gender);
        if (normalized !== selectedGender) continue;
      }

      if (selectedAgeRange !== "all") {
        if (!profile?.birth_date) continue;
        const age = calculateAge(profile.birth_date);
        if (age === null || !ageMatchesRange(age, selectedAgeRange)) continue;
      }

      eligibleAthleteIds.add(sid);
    }

    if (eligibleAthleteIds.size === 0) {
      return new Response(JSON.stringify({ ranking: [], weekLabel, boxSlug: activeBoxSlug }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Get scores for these specific athletes and workouts
    const refMetconIds = (refMetcons || []).map(m => m.id);
    let allScores: { metcon_id: string; student_id: string; score_value: string }[] = [];
    if (refMetconIds.length > 0 && eligibleAthleteIds.size > 0) {
      const { data: scores } = await supabase
        .from("metcon_scores")
        .select("metcon_id, student_id, score_value")
        .in("metcon_id", refMetconIds)
        .in("student_id", [...eligibleAthleteIds]);
      allScores = scores || [];
    }

    // 6. Get groups for labels (we'll just show the first group we find for each athlete)
    const { data: allGroupMembers } = await supabase
      .from("group_members")
      .select("student_id, group_id, groups(name)")
      .in("student_id", [...eligibleAthleteIds]);
    
    const studentGroupMap = new Map<string, string>();
    (allGroupMembers || []).forEach(m => {
      if (!studentGroupMap.has(m.student_id)) {
        studentGroupMap.set(m.student_id, (m.groups as any)?.name || "");
      }
    });

    // Group scores by metcon
    const scoresByMetcon = new Map<string, { student_id: string; score_value: string }[]>();
    for (const s of allScores) {
      if (!scoresByMetcon.has(s.metcon_id)) scoresByMetcon.set(s.metcon_id, []);
      scoresByMetcon.get(s.metcon_id)!.push(s);
    }

    // 7. Compute placements
    const workoutPlacements = new Map<string, Map<string, { position: number; score_raw: string; points: number }>>();
    const totalEligible = eligibleAthleteIds.size;

    for (const wid of rankedWorkoutIds) {
      const ref = workoutRefMetcon.get(wid)!;
      const scores = scoresByMetcon.get(ref.metcon_id) || [];

      // Only include scores from athletes currently eligible (filtered by gender/age)
      const validScores = scores.filter(s => eligibleAthleteIds.has(s.student_id));
      const parsed = validScores.map(s => ({
        student_id: s.student_id,
        score_raw: s.score_value,
        numeric: parseScore(s.score_value),
      }));

      const lowerIsBetter = ref.metcon_type === "FOR TIME";
      parsed.sort((a, b) => lowerIsBetter ? a.numeric - b.numeric : b.numeric - a.numeric);

      const placements = new Map<string, { position: number; score_raw: string; points: number }>();
      let pos = 1;
      for (let i = 0; i < parsed.length; i++) {
        let assignedPos: number;
        if (i > 0 && parsed[i].numeric === parsed[i - 1].numeric) {
          assignedPos = placements.get(parsed[i - 1].student_id)!.position;
        } else {
          assignedPos = pos;
        }
        placements.set(parsed[i].student_id, { position: assignedPos, score_raw: parsed[i].score_raw, points: assignedPos });
        pos++;
      }

      // Anyone who didn't submit a score gets max points
      const submittedIds = new Set(validScores.map(s => s.student_id));
      for (const sid of eligibleAthleteIds) {
        if (!submittedIds.has(sid)) {
          placements.set(sid, { position: totalEligible, score_raw: "—", points: totalEligible });
        }
      }

      workoutPlacements.set(wid, placements);
    }

    // 8. Build per-athlete data
    const emptySlot = { workout_id: "", score_raw: "", position: 0, points: 0 };
    const athleteData = new Map<string, {
      workout_details: { workout_id: string; score_raw: string; position: number; points: number }[];
      total_points: number;
      best_position: number;
      last_workout_position: number;
    }>();

    for (const sid of eligibleAthleteIds) {
      const slots: { workout_id: string; score_raw: string; position: number; points: number }[] = [
        { ...emptySlot }, { ...emptySlot }, { ...emptySlot }, { ...emptySlot }, { ...emptySlot },
      ];

      for (const wid of rankedWorkoutIds) {
        const placements = workoutPlacements.get(wid);
        if (!placements) continue;
        const p = placements.get(sid);
        if (!p) continue;
        const dateStr = workoutDateMap.get(wid);
        if (!dateStr) continue;
        const dayIdx = getDayIndex(dateStr);
        slots[dayIdx] = { workout_id: wid, ...p };
      }

      const filledSlots = slots.filter(s => s.workout_id !== "");
      athleteData.set(sid, {
        workout_details: slots,
        total_points: filledSlots.reduce((sum, d) => sum + d.points, 0),
        best_position: filledSlots.length > 0 ? Math.min(...filledSlots.map(d => d.position)) : totalEligible,
        last_workout_position: filledSlots.length > 0 ? filledSlots[filledSlots.length - 1].position : totalEligible,
      });
    }

    // 9. Final ranking list
    const ranking = [...athleteData.entries()]
      .map(([sid, data]) => {
        const groupName = studentGroupMap.get(sid) || "";
        const profile = profileMap.get(studentUserMap.get(sid) || "");
        return {
          student_id: sid,
          name: profile?.name || "Atleta",
          avatar_url: profile?.avatar_url || null,
          group_name: groupName,
          workout_details: data.workout_details,
          total_points: data.total_points,
          best_position: data.best_position,
          last_workout_position: data.last_workout_position,
        };
      })
      .sort((a, b) => {
        if (a.total_points !== b.total_points) return a.total_points - b.total_points;
        if (a.best_position !== b.best_position) return a.best_position - b.best_position;
        return a.last_workout_position - b.last_workout_position;
      });

    return new Response(JSON.stringify({ ranking: ranking.slice(0, selectedLimit), weekLabel, boxSlug: activeBoxSlug }), {
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
