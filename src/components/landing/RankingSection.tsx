import { useState } from "react";
import RankingContainer from "../ranking/RankingContainer";
import BoxFilter from "../ranking/BoxFilter";
import GenderFilter from "../ranking/GenderFilter";
import AgeFilter from "../ranking/AgeFilter";
import { useWeeklyRanking, type RankingGender, type RankingAgeRange } from "@/hooks/useWeeklyRanking";
import { useBoxBranding } from "@/hooks/useBoxBranding";

const RankingSection = () => {
  const [boxSlug, setBoxSlug] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<RankingGender>("all");
  const [ageRange, setAgeRange] = useState<RankingAgeRange>("all");

  const { ranking, weekLabel, loading } = useWeeklyRanking({
    boxSlug,
    gender,
    ageRange,
    limit: 10,
  });

  const branding = useBoxBranding(boxSlug);

  if (loading) {
    return (
      <section id="ranking" className="py-16 sm:py-24 bg-background">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-10 w-48 bg-secondary/40 animate-pulse mx-auto rounded mb-4" />
            <div className="h-3 w-32 bg-secondary/40 animate-pulse mx-auto rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ranking" className="py-16 sm:py-24 bg-background">
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BoxFilter value={boxSlug} onChange={setBoxSlug} />
          <GenderFilter value={gender} onChange={setGender} />
          <AgeFilter value={ageRange} onChange={setAgeRange} />
        </div>
      </div>
      {ranking.length > 0 ? (
        <RankingContainer ranking={ranking} weekLabel={weekLabel} branding={branding} />
      ) : (
        <div className="max-w-2xl mx-auto px-4">
          <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground text-center">
            Nenhum atleta encontrado com os filtros selecionados.
          </div>
        </div>
      )}
    </section>
  );
};

export default RankingSection;
