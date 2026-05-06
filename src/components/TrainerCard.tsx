import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface TrainerCardProps {
  trainer: {
    id: string;
    name: string;
    franchise_unit: string | null;
    trainer_code: string | null;
    is_official: boolean;
  };
  onSelect?: (trainer: TrainerCardProps["trainer"]) => void;
  selected?: boolean;
  showSelectButton?: boolean;
}

const TrainerCard = ({
  trainer,
  onSelect,
  selected = false,
  showSelectButton = true,
}: TrainerCardProps) => {
  const initials = trainer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-premium p-4 transition-all duration-200 ${
        selected
          ? "border-2 border-primary bg-primary/5"
          : "hover:border-primary/40 hover:bg-secondary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="font-bold text-sm text-white">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-sm md:text-base truncate text-foreground">
              {trainer.name}
            </h3>
            {selected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
          </div>

          {trainer.franchise_unit && (
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {trainer.franchise_unit}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {trainer.trainer_code && (
              <Badge variant="outline" className="font-mono text-[11px]">
                {trainer.trainer_code}
              </Badge>
            )}

            {trainer.is_official && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Oficial FitBlock
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Select Button */}
      {showSelectButton && onSelect && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant={selected ? "hero" : "outline"}
            onClick={() => onSelect(trainer)}
            className="w-full"
          >
            {selected ? "✓ Selecionado" : "Solicitar Vínculo"}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default TrainerCard;
