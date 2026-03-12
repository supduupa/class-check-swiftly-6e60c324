import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "./AttendanceStatus";
import { Student, Attendance, AttendanceStatus as Status } from "@/types/attendance";
import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: Student[];
  attendanceRecords: Attendance[];
  selectedDate: string;
  onAttendanceChange: (studentId: string, status: Status) => void;
  onAddStudent: () => void;
}

export function StudentList({ 
  students, 
  attendanceRecords, 
  selectedDate, 
  onAttendanceChange,
  onAddStudent 
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStatus = (studentId: string): Status => {
    const record = attendanceRecords.find(
      r => r.studentId === studentId && r.date === selectedDate
    );
    return record?.status || 'Absent'; // Default to Absent
  };

  const getStatusCount = (status: Status) => {
    return attendanceRecords.filter(r => r.date === selectedDate && r.status === status).length;
  };

  const statusSummary = {
    Present: getStatusCount('Present'),
    Absent: getStatusCount('Absent'),
    Late: getStatusCount('Late'),
    Excused: getStatusCount('Excused')
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add student */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAddStudent} className="bg-primary hover:bg-primary/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Status Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <Badge variant="secondary" className="bg-status-present text-status-present-foreground">
              Present: {statusSummary.Present}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="bg-status-late text-status-late-foreground">
              Late: {statusSummary.Late}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="bg-status-absent text-status-absent-foreground">
              Absent: {statusSummary.Absent}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="bg-status-excused text-status-excused-foreground">
              Excused: {statusSummary.Excused}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {searchTerm ? "No students match your search." : "No students added yet."}
          </Card>
        ) : (
          filteredStudents.map((student) => {
            const currentStatus = getAttendanceStatus(student.id);
            return (
              <Card key={student.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground truncate">
                        {student.fullName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {student.studentId}
                      </Badge>
                    </div>
                    {(student.email || student.phone) && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {student.email && student.phone 
                          ? `${student.email} • ${student.phone}`
                          : student.email || student.phone
                        }
                      </p>
                    )}
                  </div>
                  <AttendanceStatus
                    status={currentStatus}
                    onChange={(status) => onAttendanceChange(student.id, status)}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Students count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} students
      </div>
    </div>
  );
}