import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sortWeeklyRanking, type RankedAthlete } from "@/utils/rankingUtils";
import { useDebouncedValue } from "./useDebouncedValue";

export type RankingGender = "all" | "male" | "female";
export type RankingAgeRange = "all" | "sub18" | "18_34" | "35_39" | "40_plus";

interface UseWeeklyRankingOptions {
  boxSlug?: string;
  groupId?: string;
  gender?: RankingGender;
  ageRange?: RankingAgeRange;
  limit?: number;
}

interface WeeklyRankingResponse {
  ranking: RankedAthlete[];
  weekLabel: string;
  boxSlug?: string;
}

// Simple in-memory cache for ranking results
const rankingCache = new Map<string, { data: WeeklyRankingResponse; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export const useWeeklyRanking = (options: UseWeeklyRankingOptions = {}) => {
  const [ranking, setRanking] = useState<RankedAthlete[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce filter changes by 300ms to avoid rapid re-fetching
  const debouncedGender = useDebouncedValue(options.gender ?? "all", 150);
  const debouncedAgeRange = useDebouncedValue(options.ageRange ?? "all", 150);
  const debouncedBoxSlug = useDebouncedValue(options.boxSlug, 150);
  const debouncedGroupId = useDebouncedValue(options.groupId, 150);

  const requestBody = useMemo(
    () => ({
      boxSlug: debouncedBoxSlug,
      groupId: debouncedGroupId,
      gender: debouncedGender,
      ageRange: debouncedAgeRange,
      limit: options.limit ?? 100,
    }),
    [debouncedAgeRange, debouncedBoxSlug, debouncedGender, debouncedGroupId, options.limit]
  );

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const cacheKey = JSON.stringify(requestBody);

    const fetchRanking = async () => {
      // Check cache first
      const cached = rankingCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const normalized = sortWeeklyRanking(cached.data.ranking || []);
        setRanking(normalized);
        setWeekLabel(cached.data.weekLabel || "");
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke<WeeklyRankingResponse>("public-ranking", {
          body: requestBody,
        });

        if (controller.signal.aborted) return;

        if (invokeError) {
          throw new Error(invokeError.message || "Falha ao carregar ranking semanal");
        }

        // Store in cache
        if (data) {
          rankingCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        const normalized = sortWeeklyRanking(data?.ranking || []);
        setRanking(normalized);
        setWeekLabel(data?.weekLabel || "");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erro inesperado no ranking semanal");
        setRanking([]);
        setWeekLabel("");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRanking();

    return () => {
      controller.abort();
    };
  }, [requestBody]);

  return { ranking, weekLabel, loading, error };
};
