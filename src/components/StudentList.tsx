import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AttendanceStatus } from "./AttendanceStatus";
import { Student, Attendance, AttendanceStatus as Status } from "@/types/attendance";
import { Search, UserPlus, Check, Users, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  students: Student[];
  attendanceRecords: Attendance[];
  selectedDate: string;
  onAttendanceChange: (studentId: string, status: Status) => void;
  onBulkAttendanceChange: (studentIds: string[], status: Status) => void;
  onAddStudent: () => void;
  onImportStudents: () => void;
}

export function StudentList({ 
  students, 
  attendanceRecords, 
  selectedDate, 
  onAttendanceChange,
  onBulkAttendanceChange,
  onAddStudent,
  onImportStudents 
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkAction = (status: Status) => {
    const selectedIds = Array.from(selectedStudents);
    if (selectedIds.length === 0) return;

    onBulkAttendanceChange(selectedIds, status);
    setSelectedStudents(new Set());
    toast({
      title: "Attendance Updated",
      description: `Marked ${selectedIds.length} student${selectedIds.length > 1 ? 's' : ''} as ${status}.`,
    });
  };

  const handleMarkAllPresent = () => {
    const allStudentIds = students.map(s => s.id);
    onBulkAttendanceChange(allStudentIds, 'Present');
    setSelectedStudents(new Set());
    toast({
      title: "All Marked Present",
      description: `Marked all ${students.length} students as Present for today.`,
    });
  };

  const isAllSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;

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
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-status-present hover:bg-status-present-hover text-status-present-foreground">
                <Check className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark All Present</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark all {students.length} students as Present for {selectedDate}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAllPresent}>
                  Mark All Present
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            onClick={onImportStudents}
            variant="outline" 
            className="border-primary/20 hover:bg-primary/5"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={onAddStudent} className="bg-primary hover:bg-primary/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
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

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('Present')}
                className="bg-status-present hover:bg-status-present-hover text-status-present-foreground"
              >
                Mark Present
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('Late')}
                className="bg-status-late hover:bg-status-late-hover text-status-late-foreground"
              >
                Mark Late
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('Absent')}
                className="bg-status-absent hover:bg-status-absent-hover text-status-absent-foreground"
              >
                Mark Absent
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('Excused')}
                className="bg-status-excused hover:bg-status-excused-hover text-status-excused-foreground"
              >
                Mark Excused
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {searchTerm ? "No students match your search." : "No students added yet."}
          </Card>
        ) : (
          <>
            {/* Select All Checkbox */}
            {filteredStudents.length > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className={cn(isIndeterminate && "data-[state=checked]:bg-muted-foreground")}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    {isAllSelected ? "Deselect All" : isIndeterminate ? `${selectedStudents.size} Selected` : "Select All"}
                  </label>
                </div>
              </Card>
            )}
            
            {filteredStudents.map((student) => {
              const currentStatus = getAttendanceStatus(student.id);
              const isSelected = selectedStudents.has(student.id);
              return (
                <Card key={student.id} className={cn("p-4", isSelected && "bg-accent/50 border-primary/50")}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                      />
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
                    </div>
                    <AttendanceStatus
                      status={currentStatus}
                      onChange={(status) => onAttendanceChange(student.id, status)}
                    />
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Students count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} students
      </div>
    </div>
  );
}