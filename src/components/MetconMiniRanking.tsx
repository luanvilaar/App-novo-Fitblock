import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreEntry {
  student_id: string;
  name: string;
  score_value: string;
  numeric: number;
  position: number;
  isMe: boolean;
}

function parseScore(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number(trimmed) || 0;
}

interface Props {
  metconId: string;
  metconType: string;
  currentStudentId: string | null;
  refreshKey?: string;
}

const MetconMiniRanking = ({ metconId, metconType, currentStudentId, refreshKey }: Props) => {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: scores, error: scoresErr } = await supabase
        .from("metcon_scores")
        .select("student_id, score_value")
        .eq("metcon_id", metconId);

      if (scoresErr) {
        console.error("metcon_scores:", scoresErr);
        setEntries([]);
        setLoading(false);
        return;
      }

      if (!scores || scores.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(scores.map((s) => s.student_id))];
      const { data: students, error: stErr } = await supabase
        .from("students")
        .select("id, user_id")
        .in("id", studentIds);

      if (stErr) console.error("students (ranking):", stErr);

      const userIds = students?.map((s) => s.user_id) || [];
      const { data: profiles, error: prErr } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      if (prErr) console.error("profiles (ranking):", prErr);

      const studentUserMap = new Map(students?.map((s) => [s.id, s.user_id]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

      const lowerIsBetter = metconType === "FOR TIME";

      const parsed = scores.map((s) => ({
        student_id: s.student_id,
        name: profileMap.get(studentUserMap.get(s.student_id) || "") || "Atleta",
        score_value: s.score_value,
        numeric: parseScore(s.score_value),
        position: 0,
        isMe: s.student_id === currentStudentId,
      }));

      parsed.sort((a, b) => lowerIsBetter ? a.numeric - b.numeric : b.numeric - a.numeric);

      let pos = 1;
      for (let i = 0; i < parsed.length; i++) {
        if (i > 0 && parsed[i].numeric === parsed[i - 1].numeric) {
          parsed[i].position = parsed[i - 1].position;
        } else {
          parsed[i].position = pos;
        }
        pos++;
      }

      setEntries(parsed);
      setLoading(false);
    };

    fetchData();
  }, [metconId, metconType, currentStudentId, refreshKey]);

  if (loading) {
    return (
      <div className="mt-4 border-t border-white/[0.08] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-3 w-3 text-primary" />
            </div>
            <span className="font-display text-xs uppercase tracking-tight text-white/80">Ranking do grupo</span>
          </div>
        </div>
        <div className="h-16 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-4 border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-3 w-3 text-primary" />
          </div>
          <span className="font-display text-xs uppercase tracking-tight text-white/80">Ranking do grupo</span>
        </div>
        <p className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center font-body text-sm text-muted-foreground">
          Ainda não há resultados registados. Sê o primeiro a registar o teu resultado para animar o grupo.
        </p>
      </div>
    );
  }

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-500" };
    if (pos === 2) return { bg: "bg-gray-400/10", border: "border-gray-400/30", text: "text-gray-400" };
    if (pos === 3) return { bg: "bg-amber-600/10", border: "border-amber-600/30", text: "text-amber-600" };
    return { bg: "bg-transparent", border: "border-transparent", text: "text-muted-foreground" };
  };

  return (
    <div className="mt-4 border-t border-white/[0.08] pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-3 w-3 text-primary" />
          </div>
          <span className="font-display text-xs uppercase tracking-tight text-white/90">Ranking do grupo</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {entries.length} {entries.length === 1 ? "atleta" : "atletas"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616]">
        <AnimatePresence>
          <div className="divide-y divide-white/[0.06]">
            {entries.map((entry, idx) => {
              const posStyle = getPositionStyle(entry.position);
              return (
                <motion.div
                  key={entry.student_id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 transition-colors md:px-4 ${
                    entry.isMe ? "bg-primary/[0.08]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${posStyle.bg} ${posStyle.border}`}
                    >
                      <span className={`font-display text-sm font-bold ${posStyle.text}`}>{entry.position}</span>
                    </div>
                    <span
                      className={`truncate font-body text-sm ${
                        entry.isMe ? "font-semibold text-white" : "text-white/80"
                      }`}
                    >
                      {entry.isMe ? "Tu" : entry.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 font-mono text-xs tabular-nums ${
                      entry.isMe
                        ? "bg-primary/15 font-semibold text-primary"
                        : "bg-white/[0.04] text-muted-foreground"
                    }`}
                  >
                    {entry.score_value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MetconMiniRanking;
