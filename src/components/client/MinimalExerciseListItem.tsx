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
        "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-5 transition-all",
        isCompleted
          ? "bg-black text-white shadow-lg"
          : "bg-[#f3f3f3] text-black hover:bg-[#e2e2e2]"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-sans text-lg font-bold",
          isCompleted
            ? "bg-white text-black"
            : "bg-black text-white"
        )}
      >
        {isCompleted ? <Check className="h-6 w-6" strokeWidth={3} /> : letter}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[1.4px] opacity-40">
          {cat}
        </p>
        <h3 className="truncate font-sans text-lg font-bold leading-tight">
          {name}
        </h3>
        <p className="font-sans text-xs font-medium opacity-60">
          {prescription}
        </p>
      </div>

      <ChevronRight
        className={cn(
          "h-5 w-5 shrink-0 opacity-30 transition-transform group-hover:translate-x-1",
          isCompleted && "opacity-100"
        )}
      />
    </motion.div>
  );
};

export default MinimalExerciseListItem;
