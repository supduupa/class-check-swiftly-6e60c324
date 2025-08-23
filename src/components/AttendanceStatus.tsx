import { Button } from "@/components/ui/button";
import { AttendanceStatus as Status } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface AttendanceStatusProps {
  status: Status;
  onChange: (status: Status) => void;
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

export function AttendanceStatus({ status, onChange, className }: AttendanceStatusProps) {
  const currentConfig = statusConfig[status];

  const handleClick = () => {
    const currentIndex = statusOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onChange(statusOrder[nextIndex]);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "min-w-[80px] font-medium transition-all duration-200",
        currentConfig.color,
        className
      )}
      size="sm"
    >
      <span className="sm:hidden">{currentConfig.shortLabel}</span>
      <span className="hidden sm:inline">{currentConfig.label}</span>
    </Button>
  );
}