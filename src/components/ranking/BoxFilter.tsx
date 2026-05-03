import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface BoxFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

interface BoxOption {
  value: string;
  label: string;
}

// Cache boxes globally so we don't re-fetch on every mount
let cachedBoxes: BoxOption[] | null = null;

const BoxFilter = ({ value, onChange }: BoxFilterProps) => {
  const [options, setOptions] = useState<BoxOption[]>(
    cachedBoxes || []
  );

  useEffect(() => {
    if (cachedBoxes) return;
    const load = async () => {
      const { data } = await supabase
        .from("boxes")
        .select("slug, name")
        .order("name");

      if (data && Array.isArray(data) && data.length > 0) {
        const seen = new Set<string>();
        const uniqueBoxes: BoxOption[] = [];
        for (const b of data) {
          if (!b.slug || seen.has(b.slug)) continue;
          seen.add(b.slug);
          uniqueBoxes.push({ value: b.slug, label: b.name });
        }
        cachedBoxes = uniqueBoxes;
        setOptions(uniqueBoxes);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Box</p>
      <Select
        value={value ?? ""}
        onValueChange={(next) => onChange(next || undefined)}
      >
        <SelectTrigger className="h-11 rounded-xl bg-secondary border-border">
          <SelectValue placeholder="Selecione a Box" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BoxFilter;
