import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateSelector } from "@/components/DateSelector";
import { StudentList } from "@/components/StudentList";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import { CsvExportDialog } from "@/components/CsvExportDialog";
import { DailySummary } from "@/components/DailySummary";
import { Student, Attendance, AttendanceStatus, AttendanceRecord } from "@/types/attendance";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, LogOut, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useLocalStorage<Student[]>('attendance-students', []);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<Attendance[]>('attendance-records', []);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    const existingRecordIndex = attendanceRecords.findIndex(
      record => record.studentId === studentId && record.date === selectedDateString
    );

    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedRecords = [...attendanceRecords];
      updatedRecords[existingRecordIndex] = {
        ...updatedRecords[existingRecordIndex],
        status
      };
      setAttendanceRecords(updatedRecords);
    } else {
      // Create new record
      const newRecord: Attendance = {
        id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        date: selectedDateString,
        status
      };
      setAttendanceRecords(prev => [...prev, newRecord]);
    }
  };

  const handleBulkAttendanceChange = (studentIds: string[], status: AttendanceStatus) => {
    const updatedRecords = [...attendanceRecords];
    
    studentIds.forEach(studentId => {
      const existingRecordIndex = updatedRecords.findIndex(
        record => record.studentId === studentId && record.date === selectedDateString
      );

      if (existingRecordIndex >= 0) {
        // Update existing record
        updatedRecords[existingRecordIndex] = {
          ...updatedRecords[existingRecordIndex],
          status
        };
      } else {
        // Create new record
        const newRecord: Attendance = {
          id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${studentId}`,
          studentId,
          date: selectedDateString,
          status
        };
        updatedRecords.push(newRecord);
      }
    });
    
    setAttendanceRecords(updatedRecords);
  };

  const handleCsvImport = (importedStudents: Omit<Student, 'id'>[], updateExisting: boolean) => {
    const updatedStudents = [...students];
    let newCount = 0;
    let updateCount = 0;

    importedStudents.forEach(importedStudent => {
      const existingIndex = updatedStudents.findIndex(
        s => s.studentId.toLowerCase() === importedStudent.studentId.toLowerCase()
      );

      if (existingIndex >= 0) {
        if (updateExisting) {
          updatedStudents[existingIndex] = {
            ...updatedStudents[existingIndex],
            ...importedStudent
          };
          updateCount++;
        }
      } else {
        const newStudent: Student = {
          ...importedStudent,
          id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        updatedStudents.push(newStudent);
        newCount++;
      }
    });

    setStudents(updatedStudents);
    
    toast({
      title: "Import Complete",
      description: `Added ${newCount} new students${updateCount > 0 ? ` and updated ${updateCount} existing students` : ''}.`,
    });
  };

  // Create attendance records with student data for export
  const attendanceRecordsWithStudents: AttendanceRecord[] = attendanceRecords.map(record => ({
    ...record,
    student: students.find(s => s.id === record.studentId) || {
      id: record.studentId,
      studentId: 'Unknown',
      fullName: 'Unknown Student',
      email: '',
      phone: ''
    }
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Class Attendance</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowCsvExport(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <span className="text-sm text-primary-foreground/80">
                Welcome, {user?.email}
              </span>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Daily Attendance</h2>
              <p className="text-primary-foreground/80">
                Track attendance for {students.length} students
              </p>
            </div>
            <DateSelector 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <DailySummary
          students={students}
          attendanceRecords={attendanceRecords}
          selectedDate={selectedDateString}
        />
        
        <Card className="shadow-lg">
          <div className="p-6">
            <StudentList
              students={students}
              attendanceRecords={attendanceRecords}
              selectedDate={selectedDateString}
              onAttendanceChange={handleAttendanceChange}
              onBulkAttendanceChange={handleBulkAttendanceChange}
              onAddStudent={() => setShowAddStudent(true)}
              onImportStudents={() => setShowCsvImport(true)}
            />
          </div>
        </Card>
      </div>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={showAddStudent}
        onOpenChange={setShowAddStudent}
        onAddStudent={handleAddStudent}
        existingStudentIds={students.map(s => s.studentId)}
      />

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showCsvImport}
        onOpenChange={setShowCsvImport}
        onImport={handleCsvImport}
        existingStudents={students}
      />

      {/* CSV Export Dialog */}
      <CsvExportDialog
        open={showCsvExport}
        onOpenChange={setShowCsvExport}
        attendanceRecords={attendanceRecordsWithStudents}
        currentDate={selectedDateString}
      />
    </div>
  );
};

export default Index;
