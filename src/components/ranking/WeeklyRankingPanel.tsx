import { useState } from "react";
import { Hourglass, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import RankingContainer from "./RankingContainer";
import GenderFilter from "./GenderFilter";
import AgeFilter from "./AgeFilter";
import BoxFilter from "./BoxFilter";
import {
  useWeeklyRanking,
  type RankingAgeRange,
  type RankingGender,
} from "@/hooks/useWeeklyRanking";
import { useBoxBranding } from "@/hooks/useBoxBranding";

const WeeklyRankingPanel = () => {
  const [boxSlug, setBoxSlug] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<RankingGender>("all");
  const [ageRange, setAgeRange] = useState<RankingAgeRange>("all");

  const { ranking, weekLabel, loading, error } = useWeeklyRanking({
    boxSlug,
    gender,
    ageRange,
    limit: 100,
  });

  const branding = useBoxBranding(boxSlug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={branding ? { backgroundColor: `${branding.accentColor}22` } : undefined}
        >
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
          ) : (
            <Trophy className="w-4 h-4 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium tracking-tight">
            {branding ? `Ranking ${branding.name}` : "Ranking Semanal da Box"}
          </h3>
          <p className="text-[11px] text-muted-foreground">Filtros dinamicos por genero e faixa etaria</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <BoxFilter value={boxSlug} onChange={setBoxSlug} />
        <GenderFilter value={gender} onChange={setGender} />
        <AgeFilter value={ageRange} onChange={setAgeRange} />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hourglass className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Carregando ranking...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-border/40 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
          {error.toLowerCase().includes("relation") || error.toLowerCase().includes("does not exist") || error.toLowerCase().includes("column")
            ? "Ranking em atualização — voltará em breve."
            : error}
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
          Nenhum atleta encontrado com os filtros selecionados para esta semana.
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <RankingContainer ranking={ranking} weekLabel={weekLabel} branding={branding} />
      )}
    </motion.div>
  );
};

export default WeeklyRankingPanel;
