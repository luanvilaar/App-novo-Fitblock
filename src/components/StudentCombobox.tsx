import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
}

interface StudentComboboxProps {
  students: Student[];
  value: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
}

export const StudentCombobox = ({
  students,
  value,
  onChange,
  placeholder = "Selecionar atleta...",
}: StudentComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedStudent = students.find((s) => s.id === value);

  const handleSelect = (studentId: string) => {
    if (value === studentId) {
      // Desselect if clicking the same student
      onChange("");
    } else {
      // Select new student
      onChange(studentId);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-xl bg-secondary border-border hover:bg-secondary"
        >
          <span className={cn(selectedStudent ? "text-foreground" : "text-muted-foreground")}>
            {selectedStudent ? selectedStudent.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-card border-border" align="start">
        <Command className="bg-card">
          <CommandInput placeholder="Buscar atleta..." className="border-border" />
          <CommandList className="max-h-[300px]">
            {students.length === 0 ? (
              <CommandEmpty>Nenhum atleta disponível</CommandEmpty>
            ) : (
              <CommandGroup>
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={student.name}
                    onSelect={() => handleSelect(student.id)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-primary/10"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === student.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <span className={cn("flex-1", value === student.id && "text-primary font-semibold")}>
                      {student.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default StudentCombobox;
