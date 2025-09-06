import { Card } from "@/components/ui/card";
import { Student, Attendance, AttendanceStatus } from "@/types/attendance";
import { Users, UserCheck, UserX, Clock, Shield } from "lucide-react";

interface DailySummaryProps {
  students: Student[];
  attendanceRecords: Attendance[];
  selectedDate: string;
}

const statusConfig = {
  Present: {
    icon: UserCheck,
    color: "text-status-present",
    bgColor: "bg-status-present/10",
    label: "Present"
  },
  Absent: {
    icon: UserX,
    color: "text-status-absent",
    bgColor: "bg-status-absent/10",
    label: "Absent"
  },
  Late: {
    icon: Clock,
    color: "text-status-late",
    bgColor: "bg-status-late/10",
    label: "Late"
  },
  Excused: {
    icon: Shield,
    color: "text-status-excused",
    bgColor: "bg-status-excused/10",
    label: "Excused"
  }
};

export function DailySummary({ students, attendanceRecords, selectedDate }: DailySummaryProps) {
  const getStatusCount = (status: AttendanceStatus): number => {
    return attendanceRecords.filter(
      record => record.date === selectedDate && record.status === status
    ).length;
  };

  const totalStudents = students.length;
  const recordedCount = attendanceRecords.filter(record => record.date === selectedDate).length;
  const attendanceRate = totalStudents > 0 ? Math.round((getStatusCount('Present') / totalStudents) * 100) : 0;

  return (
    <Card className="p-4 sm:p-6 bg-gradient-mobile shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Daily Summary</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = getStatusCount(status);
          
          return (
            <div
              key={status}
              className={`p-3 sm:p-4 rounded-lg border-2 ${config.bgColor} transition-all duration-200 hover:scale-105 active:scale-95`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {config.label}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-border/50">
        <div className="text-sm text-muted-foreground">
          {recordedCount} of {totalStudents} students recorded
        </div>
        <div className="text-sm font-medium text-primary">
          {attendanceRate}% attendance rate
        </div>
      </div>
    </Card>
  );
}