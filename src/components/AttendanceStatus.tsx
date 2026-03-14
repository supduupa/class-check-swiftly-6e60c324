import { Button } from "@/components/ui/button";
import { AttendanceStatus as Status } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AttendanceStatusProps {
  status: Status;
  onChange: (status: Status) => void;
  onDelete?: () => void;
  className?: string;
}

const statusConfig = {
  Present: {
    color: 'bg-status-present hover:bg-status-present-hover text-status-present-foreground',
    label: 'Present',
    shortLabel: 'P'
  },
  Absent: {
    color: 'bg-status-absent hover:bg-status-absent-hover text-status-absent-foreground',
    label: 'Absent',
    shortLabel: 'A'
  },
  Late: {
    color: 'bg-status-late hover:bg-status-late-hover text-status-late-foreground',
    label: 'Late',
    shortLabel: 'L'
  },
  Excused: {
    color: 'bg-status-excused hover:bg-status-excused-hover text-status-excused-foreground',
    label: 'Excused',
    shortLabel: 'E'
  }
};

const statusOrder: Status[] = ['Present', 'Late', 'Absent', 'Excused'];

export function AttendanceStatus({ status, onChange, onDelete, className }: AttendanceStatusProps) {
  const { profile } = useAuth();
  const currentConfig = statusConfig[status];
  const isStaff = profile?.role === 'Teacher' || profile?.role === 'CourseRep';

  const handleClick = () => {
    const currentIndex = statusOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onChange(statusOrder[nextIndex]);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleClick}
        className={cn(
          "min-w-[70px] sm:min-w-[90px] lg:min-w-[100px] min-h-[40px] sm:min-h-[44px] font-medium transition-all duration-200 shadow-sm hover:shadow-md border-2 active:scale-95 text-xs sm:text-sm",
          currentConfig.color,
          className
        )}
        size="sm"
      >
        <span className="md:hidden text-xs font-semibold">{currentConfig.shortLabel}</span>
        <span className="hidden md:flex text-sm">{currentConfig.label}</span>
      </Button>
      {isStaff && onDelete && (
        <Button
          onClick={onDelete}
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 min-h-[44px]"
          title="Delete attendance record"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}