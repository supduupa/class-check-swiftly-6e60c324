import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { DateSelector } from "@/components/DateSelector";
import { StudentList } from "@/components/StudentList";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Student, Attendance, AttendanceStatus } from "@/types/attendance";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useLocalStorage<Student[]>('attendance-students', []);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<Attendance[]>('attendance-records', []);
  const [showAddStudent, setShowAddStudent] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Class Attendance</h1>
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
        <Card className="shadow-lg">
          <div className="p-6">
            <StudentList
              students={students}
              attendanceRecords={attendanceRecords}
              selectedDate={selectedDateString}
              onAttendanceChange={handleAttendanceChange}
              onAddStudent={() => setShowAddStudent(true)}
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
    </div>
  );
};

export default Index;
