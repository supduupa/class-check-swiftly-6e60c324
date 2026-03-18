import { useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AttendanceStatus } from "./AttendanceStatus";
import { Student, AttendanceStatus as Status } from "@/types/attendance";
import { Trash2, StickyNote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusOrder: Status[] = ['Present', 'Late', 'Absent', 'Excused'];

const statusColors: Record<Status, string> = {
  Present: 'bg-status-present/20 border-status-present',
  Late: 'bg-status-late/20 border-status-late',
  Absent: 'bg-status-absent/20 border-status-absent',
  Excused: 'bg-status-excused/20 border-status-excused',
};

interface SwipeableStudentCardProps {
  student: Student;
  currentStatus: Status;
  currentNote: string;
  isSelected: boolean;
  onAttendanceChange: (studentId: string, status: Status) => void;
  onDeleteAttendance: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectStudent: (studentId: string, checked: boolean) => void;
  onRowClick: (student: Student, event: React.MouseEvent) => void;
}

export function SwipeableStudentCard({
  student,
  currentStatus,
  currentNote,
  isSelected,
  onAttendanceChange,
  onDeleteAttendance,
  onDeleteStudent,
  onSelectStudent,
  onRowClick,
}: SwipeableStudentCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeHint, setSwipeHint] = useState<Status | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const getNextStatus = useCallback((direction: 'left' | 'right'): Status => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (direction === 'right') {
      return statusOrder[(currentIndex + 1) % statusOrder.length];
    }
    return statusOrder[(currentIndex - 1 + statusOrder.length) % statusOrder.length];
  }, [currentStatus]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!isHorizontalSwipe.current) return;

    e.preventDefault();
    const clamped = Math.max(-120, Math.min(120, deltaX));
    setSwipeOffset(clamped);

    if (Math.abs(clamped) > 40) {
      setSwipeHint(getNextStatus(clamped > 0 ? 'right' : 'left'));
    } else {
      setSwipeHint(null);
    }
  }, [getNextStatus]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(swipeOffset) > 40 && isHorizontalSwipe.current) {
      const direction = swipeOffset > 0 ? 'right' : 'left';
      const nextStatus = getNextStatus(direction);
      onAttendanceChange(student.id, nextStatus);
    }
    setSwipeOffset(0);
    setIsSwiping(false);
    setSwipeHint(null);
    isHorizontalSwipe.current = null;
  }, [swipeOffset, getNextStatus, onAttendanceChange, student.id]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe background indicators */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none z-0">
        <div className={cn(
          "flex items-center gap-2 pl-4 transition-opacity duration-150",
          swipeOffset < -30 ? "opacity-100" : "opacity-0"
        )}>
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          {swipeHint && swipeOffset < 0 && (
            <Badge className={cn("text-xs font-bold", statusColors[swipeHint])}>
              {swipeHint}
            </Badge>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-2 pr-4 transition-opacity duration-150",
          swipeOffset > 30 ? "opacity-100" : "opacity-0"
        )}>
          {swipeHint && swipeOffset > 0 && (
            <Badge className={cn("text-xs font-bold", statusColors[swipeHint])}>
              {swipeHint}
            </Badge>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <Card
        className={cn(
          "p-4 cursor-pointer transition-all border-2 relative z-10",
          !isSwiping && "duration-200 hover:bg-accent/40 hover:shadow-md",
          isSwiping && "duration-0",
          isSelected && "bg-accent/50 border-primary/60 shadow-sm",
          swipeHint && statusColors[swipeHint]
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onClick={(e) => !isSwiping && onRowClick(student, e)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectStudent(student.id, checked as boolean)}
                className="mt-1 h-5 w-5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate text-base">
                    {student.fullName}
                  </h3>
                  {currentNote && (
                    <div title="Has note" className="flex-shrink-0">
                      <StickyNote className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    ID: {student.studentId}
                  </Badge>
                </div>
                {(student.email || student.phone) && (
                  <p className="text-sm text-muted-foreground truncate">
                    {student.email && student.phone
                      ? `${student.email} • ${student.phone}`
                      : student.email || student.phone}
                  </p>
                )}
                {currentNote && (
                  <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded-md italic border-l-2 border-primary/30">
                    "{currentNote}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Swipe hint for mobile */}
          <p className="text-[10px] text-muted-foreground text-center md:hidden select-none">
            ← Swipe to change status →
          </p>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="flex-1">
              <AttendanceStatus
                status={currentStatus}
                onChange={(status) => onAttendanceChange(student.id, status)}
                onDelete={() => onDeleteAttendance(student.id)}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:border-destructive/20 h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {student.fullName}? This will permanently remove the student and all their attendance records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteStudent(student.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Student
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </div>
  );
}
