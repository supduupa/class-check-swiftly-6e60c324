import { Class } from "@/types/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap } from "lucide-react";

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId: string | null;
  onSelectClass: (classId: string | null) => void;
  loading?: boolean;
  showAllOption?: boolean;
}

export function ClassSelector({ 
  classes, 
  selectedClassId, 
  onSelectClass,
  loading = false,
  showAllOption = false
}: ClassSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-5 w-5 text-muted-foreground" />
      <Select 
        value={selectedClassId || "all"} 
        onValueChange={(value) => onSelectClass(value === "all" ? null : value)}
        disabled={loading}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && <SelectItem value="all">All Classes</SelectItem>}
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.class_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
