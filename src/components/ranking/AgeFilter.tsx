import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RankingAgeRange } from "@/hooks/useWeeklyRanking";

interface AgeFilterProps {
  value: RankingAgeRange;
  onChange: (value: RankingAgeRange) => void;
}

const AGE_OPTIONS: { value: RankingAgeRange; label: string }[] = [
  { value: "all", label: "Todas as idades" },
  { value: "sub18", label: "Sub 18" },
  { value: "18_34", label: "18 - 34" },
  { value: "35_39", label: "35 - 39" },
  { value: "40_plus", label: "40 - 50+" },
];

const AgeFilter = ({ value, onChange }: AgeFilterProps) => {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Faixa etaria</p>
      <Select value={value} onValueChange={(next) => onChange(next as RankingAgeRange)}>
        <SelectTrigger className="h-11 rounded-xl bg-secondary border-border">
          <SelectValue placeholder="Faixa etaria" />
        </SelectTrigger>
        <SelectContent>
          {AGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AgeFilter;
