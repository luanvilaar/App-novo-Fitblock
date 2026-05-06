import { useEffect, useState } from "react";
import { fetchConsistencySnapshot, type ConsistencySnapshot } from "@/lib/consistency-snapshot";

export type { ConsistencySnapshot };

export function useConsistencySnapshot(
  studentId: string | null,
  primaryGroup: { id: string; name: string } | null,
) {
  const [snapshot, setSnapshot] = useState<ConsistencySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setSnapshot(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchConsistencySnapshot(studentId, primaryGroup)
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar");
          setSnapshot(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, primaryGroup?.id]);

  return { snapshot, loading, error };
}
