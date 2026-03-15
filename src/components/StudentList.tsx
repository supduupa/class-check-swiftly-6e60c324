import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SwipeableStudentCard } from "./SwipeableStudentCard";
import { Student, Attendance, AttendanceStatus as Status } from "@/types/attendance";
import { Search, UserPlus, Check, Users, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  students: Student[];
  attendanceRecords: Attendance[];
  selectedDate: string;
  onAttendanceChange: (studentId: string, status: Status) => void;
  onBulkAttendanceChange: (studentIds: string[], status: Status) => void;
  onDeleteAttendance: (studentId: string) => void;
  onAddStudent: () => void;
  onImportStudents: () => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateNote: (studentId: string, note: string) => void;
}

export function StudentList({ 
  students, 
  attendanceRecords, 
  selectedDate, 
  onAttendanceChange,
  onBulkAttendanceChange,
  onDeleteAttendance,
  onAddStudent,
  onImportStudents,
  onDeleteStudent,
  onUpdateNote
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [noteText, setNoteText] = useState("");
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

  const getAttendanceNote = (studentId: string): string => {
    const record = attendanceRecords.find(
      r => r.studentId === studentId && r.date === selectedDate
    );
    return record?.note || '';
  };

  const handleRowClick = (student: Student, event: React.MouseEvent) => {
    // Don't open if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[role="button"]')) {
      return;
    }
    
    setSelectedStudentForNote(student);
    setNoteText(getAttendanceNote(student.id));
    setNoteSheetOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedStudentForNote) return;
    
    await onUpdateNote(selectedStudentForNote.id, noteText);
    setNoteSheetOpen(false);
    setSelectedStudentForNote(null);
    setNoteText("");
    
    toast({
      title: "Note Updated",
      description: `Note updated for ${selectedStudentForNote.fullName}`,
    });
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

  const handleBulkDelete = () => {
    const selectedIds = Array.from(selectedStudents);
    if (selectedIds.length === 0) return;

    selectedIds.forEach(studentId => {
      onDeleteStudent(studentId);
    });
    setSelectedStudents(new Set());
    toast({
      title: "Students Deleted",
      description: `Successfully deleted ${selectedIds.length} student${selectedIds.length > 1 ? 's' : ''}.`,
    });
  };

  const isAllSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;

  return (
    <div className="space-y-6">
      {/* Header with search and add student */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="mobile"
                  className="bg-status-present hover:bg-status-present-hover text-status-present-foreground min-h-[44px]"
                >
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
              size="mobile"
              className="border-primary/20 hover:bg-primary/5 min-h-[44px]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button 
              onClick={onAddStudent} 
              size="mobile"
              className="bg-primary hover:bg-primary/90 min-h-[44px]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <Card className="p-4 bg-gradient-mobile">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-2">
            <Badge variant="secondary" className="bg-status-present text-status-present-foreground text-xs sm:text-sm px-2 py-1">
              Present: {statusSummary.Present}
            </Badge>
          </div>
          <div className="text-center p-2">
            <Badge variant="secondary" className="bg-status-late text-status-late-foreground text-xs sm:text-sm px-2 py-1">
              Late: {statusSummary.Late}
            </Badge>
          </div>
          <div className="text-center p-2">
            <Badge variant="secondary" className="bg-status-absent text-status-absent-foreground text-xs sm:text-sm px-2 py-1">
              Absent: {statusSummary.Absent}
            </Badge>
          </div>
          <div className="text-center p-2">
            <Badge variant="secondary" className="bg-status-excused text-status-excused-foreground text-xs sm:text-sm px-2 py-1">
              Excused: {statusSummary.Excused}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <Card className="p-4 bg-accent/30 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4" />
              {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              <Button
                size="mobile"
                onClick={() => handleBulkAction('Present')}
                className="bg-status-present hover:bg-status-present-hover text-status-present-foreground text-sm"
              >
                Present
              </Button>
              <Button
                size="mobile"
                onClick={() => handleBulkAction('Late')}
                className="bg-status-late hover:bg-status-late-hover text-status-late-foreground text-sm"
              >
                Late
              </Button>
              <Button
                size="mobile"
                onClick={() => handleBulkAction('Absent')}
                className="bg-status-absent hover:bg-status-absent-hover text-status-absent-foreground text-sm"
              >
                Absent
              </Button>
              <Button
                size="mobile"
                onClick={() => handleBulkAction('Excused')}
                className="bg-status-excused hover:bg-status-excused-hover text-status-excused-foreground text-sm"
              >
                Excused
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="mobile"
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Students</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedStudents.size} selected student{selectedStudents.size > 1 ? 's' : ''}? This will permanently remove the student{selectedStudents.size > 1 ? 's' : ''} and all their attendance records. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBulkDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
              <Card className="p-4 bg-muted/30 border-dashed border-muted-foreground/20">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className={cn(
                      "h-5 w-5", 
                      isIndeterminate && "data-[state=checked]:bg-muted-foreground"
                    )}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">
                    {isAllSelected ? "Deselect All Students" : isIndeterminate ? `${selectedStudents.size} Students Selected` : "Select All Students"}
                  </label>
                </div>
              </Card>
            )}
            
            {filteredStudents.map((student) => {
              const currentStatus = getAttendanceStatus(student.id);
              const currentNote = getAttendanceNote(student.id);
              const isSelected = selectedStudents.has(student.id);
              return (
                <Card 
                  key={student.id} 
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:bg-accent/40 hover:shadow-md border-2", 
                    isSelected && "bg-accent/50 border-primary/60 shadow-sm"
                  )}
                  onClick={(e) => handleRowClick(student, e)}
                >
                  <div className="space-y-3">
                    {/* Top row with checkbox and student info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
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
                                : student.email || student.phone
                              }
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

                    {/* Bottom row with actions */}
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
              );
            })}
          </>
        )}
      </div>

      {/* Students count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Note Sheet */}
      <Sheet open={noteSheetOpen} onOpenChange={setNoteSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Note for {selectedStudentForNote?.fullName}</SheetTitle>
            <SheetDescription>
              Add a note for {selectedDate} attendance (e.g., "medical excuse", "family emergency")
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="note" className="text-sm font-medium">Note</label>
              <Textarea
                id="note"
                placeholder="Enter attendance note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveNote} className="flex-1">
                Save Note
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setNoteSheetOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}