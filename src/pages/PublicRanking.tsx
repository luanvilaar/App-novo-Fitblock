import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Trophy } from "lucide-react";
import RankingContainer from "@/components/ranking/RankingContainer";
import GenderFilter from "@/components/ranking/GenderFilter";
import AgeFilter from "@/components/ranking/AgeFilter";
import {
  useWeeklyRanking,
  type RankingAgeRange,
  type RankingGender,
} from "@/hooks/useWeeklyRanking";
import { useBoxBranding } from "@/hooks/useBoxBranding";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PublicRanking = () => {
  const { boxSlug } = useParams<{ boxSlug: string }>();
  const [gender, setGender] = useState<RankingGender>("all");
  const [ageRange, setAgeRange] = useState<RankingAgeRange>("all");

  const { ranking, weekLabel, loading, error } = useWeeklyRanking({
    boxSlug,
    gender,
    ageRange,
    limit: 100,
  });

  const branding = useBoxBranding(boxSlug);

  const handleShare = async () => {
    const url = window.location.href;
    const title = branding
      ? `Ranking Semanal – ${branding.name}`
      : "Ranking Semanal – FitBlock Training";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-safe py-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>

          <Button
            variant="secondary-pill"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-safe py-8 sm:py-12">
        {/* Branding hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-8 rounded-[32px] p-6 text-center sm:p-8"
        >
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={branding.name}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl object-contain"
            />
          )}
          <h1 className="mb-1 text-2xl font-display sm:text-3xl">
            {branding ? (
              <>
                Ranking{" "}
                <span style={{ color: branding.accentColor }}>
                  {branding.name}
                </span>
              </>
            ) : (
              <>
                Ranking <span className="text-primary">Semanal</span>
              </>
            )}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
            WODs de Segunda a Sexta · Menor pontuação = melhor posição
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <GenderFilter value={gender} onChange={setGender} />
          <AgeFilter value={ageRange} onChange={setAgeRange} />
        </motion.div>

        {/* Content */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-secondary/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card-premium rounded-[28px] px-4 py-6 text-center text-sm text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            {error.toLowerCase().includes("relation") ||
            error.toLowerCase().includes("does not exist")
              ? "Ranking em atualização — voltará em breve."
              : error}
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="card-premium rounded-[28px] px-4 py-6 text-center text-sm text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            Nenhum atleta encontrado com os filtros selecionados para esta
            semana.
          </div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <RankingContainer
            ranking={ranking}
            weekLabel={weekLabel}
            branding={branding}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 py-6 text-center">
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
        >
          FitBlock Training System
        </Link>
      </footer>
    </div>
  );
};

export default PublicRanking;
