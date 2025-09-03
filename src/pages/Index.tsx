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
import RoleManagement from "@/components/RoleManagement";
import { Student, Attendance, AttendanceStatus, AttendanceRecord } from "@/types/attendance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, LogOut, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  // Load data from Supabase
  useEffect(() => {
    loadStudents();
    loadAttendance();
  }, []);

  useEffect(() => {
    loadAttendance(); // Reload attendance when date changes
  }, [selectedDateString]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Error loading students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive',
        });
        return;
      }

      setStudents((data || []).map(student => ({
        id: student.id,
        fullName: student.full_name,
        studentId: student.student_id,
        email: student.email,
        phone: student.phone
      })));
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance records',
          variant: 'destructive',
        });
        return;
      }

      setAttendanceRecords((data || []).map(record => ({
        id: record.id,
        studentId: record.student_id,
        date: record.date,
        status: record.status,
        note: record.note
      })));
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          full_name: studentData.fullName,
          student_id: studentData.studentId,
          email: studentData.email,
          phone: studentData.phone
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding student:', error);
        toast({
          title: 'Error',
          description: 'Failed to add student',
          variant: 'destructive',
        });
        return;
      }

      const newStudent: Student = {
        id: data.id,
        fullName: data.full_name,
        studentId: data.student_id,
        email: data.email,
        phone: data.phone
      };

      setStudents(prev => [...prev, newStudent]);
      toast({
        title: 'Success',
        description: `${studentData.fullName} has been added to the class`,
      });
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  const handleAttendanceChange = async (studentId: string, status: AttendanceStatus) => {
    try {
      const existingRecordIndex = attendanceRecords.findIndex(
        record => record.studentId === studentId && record.date === selectedDateString
      );

      if (existingRecordIndex >= 0) {
        // Update existing record
        const recordId = attendanceRecords[existingRecordIndex].id;
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', recordId);

        if (error) {
          console.error('Error updating attendance:', error);
          toast({
            title: 'Error',
            description: 'Failed to update attendance',
            variant: 'destructive',
          });
          return;
        }

        const updatedRecords = [...attendanceRecords];
        updatedRecords[existingRecordIndex] = {
          ...updatedRecords[existingRecordIndex],
          status
        };
        setAttendanceRecords(updatedRecords);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: selectedDateString,
            status
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating attendance:', error);
          toast({
            title: 'Error',
            description: 'Failed to record attendance',
            variant: 'destructive',
          });
          return;
        }

        const newRecord: Attendance = {
          id: data.id,
          studentId: data.student_id,
          date: data.date,
          status: data.status,
          note: data.note
        };
        setAttendanceRecords(prev => [...prev, newRecord]);
      }
    } catch (error) {
      console.error('Error handling attendance change:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAttendance = async (studentId: string) => {
    try {
      const existingRecord = attendanceRecords.find(
        record => record.studentId === studentId && record.date === selectedDateString
      );

      if (!existingRecord) {
        toast({
          title: 'Notice',
          description: 'No attendance record found to delete',
        });
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', existingRecord.id);

      if (error) {
        console.error('Error deleting attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete attendance record',
          variant: 'destructive',
        });
        return;
      }

      // Remove from local state
      setAttendanceRecords(prev => 
        prev.filter(record => record.id !== existingRecord.id)
      );

      toast({
        title: 'Success',
        description: 'Attendance record deleted',
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete attendance record',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAttendanceChange = async (studentIds: string[], status: AttendanceStatus) => {
    try {
      const updates = [];
      const inserts = [];
      
      for (const studentId of studentIds) {
        const existingRecordIndex = attendanceRecords.findIndex(
          record => record.studentId === studentId && record.date === selectedDateString
        );

        if (existingRecordIndex >= 0) {
          // Update existing record
          updates.push({
            id: attendanceRecords[existingRecordIndex].id,
            status
          });
        } else {
          // Create new record
          inserts.push({
            student_id: studentId,
            date: selectedDateString,
            status
          });
        }
      }

      // Handle updates
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('attendance')
            .update({ status: update.status })
            .eq('id', update.id);

          if (error) {
            console.error('Error updating attendance:', error);
            toast({
              title: 'Error',
              description: 'Failed to update some attendance records',
              variant: 'destructive',
            });
            return;
          }
        }
      }

      // Handle inserts
      if (inserts.length > 0) {
        const { error } = await supabase
          .from('attendance')
          .insert(inserts);

        if (error) {
          console.error('Error creating attendance:', error);
          toast({
            title: 'Error',
            description: 'Failed to create some attendance records',
            variant: 'destructive',
          });
          return;
        }
      }

      // Update local state
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
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${studentId}`,
            studentId,
            date: selectedDateString,
            status
          };
          updatedRecords.push(newRecord);
        }
      });
      
      setAttendanceRecords(updatedRecords);
      
      toast({
        title: 'Success',
        description: `Updated attendance for ${studentIds.length} students`,
      });

      // Reload attendance to get correct IDs
      setTimeout(loadAttendance, 100);
    } catch (error) {
      console.error('Error handling bulk attendance change:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance records',
        variant: 'destructive',
      });
    }
  };

  const handleCsvImport = async (importedStudents: Omit<Student, 'id'>[], updateExisting: boolean) => {
    const updatedStudents = [...students];
    let newCount = 0;
    let updateCount = 0;

    try {
      for (const importedStudent of importedStudents) {
        const existingIndex = updatedStudents.findIndex(
          s => s.studentId.toLowerCase() === importedStudent.studentId.toLowerCase()
        );

        if (existingIndex >= 0) {
          if (updateExisting) {
            // Update existing student in database
            const { error } = await supabase
              .from('students')
              .update({
                full_name: importedStudent.fullName,
                email: importedStudent.email,
                phone: importedStudent.phone
              })
              .eq('id', updatedStudents[existingIndex].id);

            if (error) {
              console.error('Error updating student:', error);
              continue;
            }

            updatedStudents[existingIndex] = {
              ...updatedStudents[existingIndex],
              ...importedStudent
            };
            updateCount++;
          }
        } else {
          // Add new student to database
          const { data, error } = await supabase
            .from('students')
            .insert({
              full_name: importedStudent.fullName,
              student_id: importedStudent.studentId,
              email: importedStudent.email,
              phone: importedStudent.phone
            })
            .select()
            .single();

          if (error) {
            console.error('Error adding student:', error);
            continue;
          }

          const newStudent: Student = {
            id: data.id,
            fullName: data.full_name,
            studentId: data.student_id,
            email: data.email,
            phone: data.phone
          };
          updatedStudents.push(newStudent);
          newCount++;
        }
      }

      setStudents(updatedStudents);
      
      toast({
        title: "Import Complete",
        description: `Added ${newCount} new students${updateCount > 0 ? ` and updated ${updateCount} existing students` : ''}.`,
      });
    } catch (error) {
      console.error('Error importing students:', error);
      toast({
        title: 'Error',
        description: 'Failed to import some students',
        variant: 'destructive',
      });
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <GraduationCap className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

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
                Welcome, {profile?.full_name} ({profile?.role})
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
      <div className="container mx-auto px-4 py-8 space-y-6">
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
              onDeleteAttendance={handleDeleteAttendance}
              onAddStudent={() => setShowAddStudent(true)}
              onImportStudents={() => setShowCsvImport(true)}
            />
          </div>
        </Card>

        <RoleManagement />
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
