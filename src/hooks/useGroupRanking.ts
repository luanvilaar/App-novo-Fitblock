import { useState, useEffect } from "react";
import { computeGroupRanking, type RankedMember } from "@/lib/group-ranking";

export type { RankedMember };

export const useGroupRanking = (groupId: string | null) => {
  const [ranking, setRanking] = useState<RankedMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const calculate = async () => {
      setLoading(true);
      try {
        const ranked = await computeGroupRanking(groupId);
        setRanking(ranked);
      } catch (e) {
        console.error("Ranking error:", e);
        setRanking([]);
      }
      setLoading(false);
    };
    void calculate();
  }, [groupId]);

  return { ranking, loading };
};
