import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalExerciseListItemProps {
  letter: string;
  name: string;
  prescription: string;
  category?: string;
  isCompleted?: boolean;
  onClick: () => void;
  index: number;
}

/** Alinha ao card de protocolo do dia (ClientHome / TrainerPanelCard): roxo primary, bordas suaves, sem “industrial”. */
const formatCategoryLabel = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .split(/[\s_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Geral";

const MinimalExerciseListItem = ({
  letter,
  name,
  prescription,
  category = "geral",
  isCompleted,
  onClick,
  index,
}: MinimalExerciseListItemProps) => {
  const cat = formatCategoryLabel(category);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-5 transition-all duration-300 md:gap-5",
        isCompleted
          ? "border-primary/25 bg-primary/[0.08] shadow-[0_0_24px_rgba(65,31,128,0.08)]"
          : "border-white/[0.08] bg-[#161616] hover:border-primary/30 hover:bg-white/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border font-display text-lg font-bold transition-colors",
          isCompleted
            ? "border-primary/35 bg-primary/15 text-white"
            : "border-white/[0.08] bg-white/[0.04] text-white/50 group-hover:border-primary/35 group-hover:text-primary",
        )}
      >
        {isCompleted ? <Check className="h-7 w-7" strokeWidth={2.5} /> : letter}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h3
          className={cn(
            "line-clamp-2 font-display text-base font-bold uppercase leading-snug tracking-tight transition-colors md:text-lg",
            isCompleted ? "text-white" : "text-white group-hover:text-primary",
          )}
        >
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 font-body text-[11px] font-medium",
              isCompleted ? "border-primary/25 text-primary/90" : "border-white/10 text-muted-foreground",
            )}
          >
            {cat}
          </span>
          <span className="font-body text-xs tabular-nums text-muted-foreground">{prescription}</span>
        </div>
      </div>

      <ChevronRight
        className={cn(
          "h-5 w-5 shrink-0 transition-all group-hover:translate-x-0.5",
          isCompleted ? "text-primary/60" : "text-white/25 group-hover:text-primary",
        )}
      />
    </motion.div>
  );
};

export default MinimalExerciseListItem;
