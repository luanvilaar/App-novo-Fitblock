import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RankingGender } from "@/hooks/useWeeklyRanking";

interface GenderFilterProps {
  value: RankingGender;
  onChange: (value: RankingGender) => void;
}

const GENDER_OPTIONS: { value: RankingGender; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
];

const GenderFilter = ({ value, onChange }: GenderFilterProps) => {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Genero</p>
      <Select value={value} onValueChange={(next) => onChange(next as RankingGender)}>
        <SelectTrigger className="h-11 rounded-xl bg-secondary border-border">
          <SelectValue placeholder="Genero" />
        </SelectTrigger>
        <SelectContent>
          {GENDER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GenderFilter;
