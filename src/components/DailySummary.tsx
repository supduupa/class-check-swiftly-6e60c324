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

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Daily Summary</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = getStatusCount(status);
          
          return (
            <div
              key={status}
              className={`p-3 rounded-lg border ${config.bgColor} transition-all duration-200`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </span>
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        {recordedCount} of {totalStudents} students recorded
      </div>
    </Card>
  );
}