import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateSelector } from "@/components/DateSelector";
import { StudentList } from "@/components/StudentList";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { AddClassDialog } from "@/components/AddClassDialog";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import { CsvExportDialog } from "@/components/CsvExportDialog";
import { DailySummary } from "@/components/DailySummary";
import { MobileHeader } from "@/components/MobileHeader";
import RoleManagement from "@/components/RoleManagement";
import { Student, Attendance, AttendanceStatus, AttendanceRecord, Class } from "@/types/attendance";
import { ClassSelector } from "@/components/ClassSelector";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, LogOut, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  // Load data from Supabase
  useEffect(() => {
    if (profile) {
      void loadClasses();
    }
  }, [profile]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setAttendanceRecords([]);
      return;
    }

    setLoading(true);
    void Promise.all([loadStudents(), loadAttendance()]).finally(() => {
      setLoading(false);
    });
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      void loadAttendance(); // Reload attendance when date changes
    }
  }, [selectedDateString]);

  const loadClasses = async () => {
    try {
      if (!profile) return;

      let query = supabase.from('classes').select('*').order('class_name');

      // Filter based on role
      if (profile.role === 'Teacher') {
        // Teachers only see their own classes
        query = query.eq('teacher_id', profile.id);
      } else if (profile.role === 'CourseRep') {
        // CourseReps only see their assigned class
        const { data: studentData } = await supabase
          .from('students')
          .select('class_id')
          .eq('user_id', profile.id)
          .single();

        if (studentData?.class_id) {
          query = query.eq('id', studentData.class_id);
        } else {
          // CourseRep has no class assigned
          setClasses([]);
          setSelectedClassId(null);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading classes:', error);
        setLoading(false);
        return;
      }

      const loadedClasses = (data || []).map(cls => ({
        id: cls.id,
        class_name: cls.class_name,
        teacher_id: cls.teacher_id,
        description: cls.description
      }));

      setClasses(loadedClasses);

      if (loadedClasses.length === 0) {
        setSelectedClassId(null);
        setStudents([]);
        setAttendanceRecords([]);
        setLoading(false);
        return;
      }

      // Auto-select the first class when no class is selected or current selection is stale
      if (!selectedClassId || !loadedClasses.some(cls => cls.id === selectedClassId)) {
        setSelectedClassId(loadedClasses[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      let query = supabase
        .from('students')
        .select('*')
        .order('full_name');

      // Filter by class if selected
      if (selectedClassId) {
        query = query.eq('class_id', selectedClassId);
      }

      const { data, error } = await query;

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
        phone: student.phone,
        classId: student.class_id
      })));
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      // Filter by class if selected
      if (selectedClassId) {
        query = query.eq('class_id', selectedClassId);
      }

      const { data, error } = await query;

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
        note: record.note,
        classId: record.class_id
      })));
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleAddClass = async (classData: { class_name: string; description?: string }) => {
    if (!profile?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          class_name: classData.class_name,
          description: classData.description,
          teacher_id: profile.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating class:', error);
        toast({
          title: 'Error',
          description: 'Failed to create class',
          variant: 'destructive',
        });
        return;
      }

      const newClass: Class = {
        id: data.id,
        class_name: data.class_name,
        teacher_id: data.teacher_id,
        description: data.description
      };

      setClasses(prev => [...prev, newClass]);
      toast({
        title: 'Success',
        description: `${classData.class_name} has been created`,
      });
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: 'Error',
        description: 'Failed to create class',
        variant: 'destructive',
      });
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
          phone: studentData.phone,
          class_id: studentData.classId || selectedClassId
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
        phone: data.phone,
        classId: data.class_id
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
        const student = students.find(s => s.id === studentId);
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: selectedDateString,
            status,
            class_id: student?.classId || selectedClassId
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
          note: data.note,
          classId: data.class_id
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

  const handleUpdateNote = async (studentId: string, note: string) => {
    try {
      const existingRecordIndex = attendanceRecords.findIndex(
        record => record.studentId === studentId && record.date === selectedDateString
      );

      if (existingRecordIndex >= 0) {
        // Update existing record
        const recordId = attendanceRecords[existingRecordIndex].id;
        const { error } = await supabase
          .from('attendance')
          .update({ note })
          .eq('id', recordId);

        if (error) {
          console.error('Error updating note:', error);
          toast({
            title: 'Error',
            description: 'Failed to update note',
            variant: 'destructive',
          });
          return;
        }

        const updatedRecords = [...attendanceRecords];
        updatedRecords[existingRecordIndex] = {
          ...updatedRecords[existingRecordIndex],
          note
        };
        setAttendanceRecords(updatedRecords);
      } else {
        // Create new record with default status and note
        const student = students.find(s => s.id === studentId);
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: selectedDateString,
            status: 'Absent',
            note,
            class_id: student?.classId || selectedClassId
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating attendance with note:', error);
          toast({
            title: 'Error',
            description: 'Failed to save note',
            variant: 'destructive',
          });
          return;
        }

        const newRecord: Attendance = {
          id: data.id,
          studentId: data.student_id,
          date: data.date,
          status: data.status,
          note: data.note,
          classId: data.class_id
        };

        setAttendanceRecords(prev => [...prev, newRecord]);
      }
    } catch (error) {
      console.error('Error updating note:', error);
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
          const student = students.find(s => s.id === studentId);
          inserts.push({
            student_id: studentId,
            date: selectedDateString,
            status,
            class_id: student?.classId || selectedClassId
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

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // First delete all attendance records for this student
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('student_id', studentId);

      if (attendanceError) {
        console.error('Error deleting student attendance:', attendanceError);
        toast({
          title: 'Error',
          description: 'Failed to delete student attendance records',
          variant: 'destructive',
        });
        return;
      }

      // Then delete the student
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (studentError) {
        console.error('Error deleting student:', studentError);
        toast({
          title: 'Error',
          description: 'Failed to delete student',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setStudents(prev => prev.filter(student => student.id !== studentId));
      setAttendanceRecords(prev => prev.filter(record => record.studentId !== studentId));

      toast({
        title: 'Success',
        description: 'Student and all associated attendance records have been deleted',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      // First delete all attendance records for this class
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId);

      if (attendanceError) {
        console.error('Error deleting class attendance:', attendanceError);
        toast({
          title: 'Error',
          description: 'Failed to delete attendance records',
          variant: 'destructive',
        });
        return;
      }

      // Then delete all students in this class
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .eq('class_id', classId);

      if (studentsError) {
        console.error('Error deleting class students:', studentsError);
        toast({
          title: 'Error',
          description: 'Failed to delete students',
          variant: 'destructive',
        });
        return;
      }

      // Finally delete the class
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (classError) {
        console.error('Error deleting class:', classError);
        toast({
          title: 'Error',
          description: 'Failed to delete class',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setClasses(prev => prev.filter(cls => cls.id !== classId));
      
      // If the deleted class was selected, clear selection
      if (selectedClassId === classId) {
        setSelectedClassId(null);
        setStudents([]);
        setAttendanceRecords([]);
      }

      toast({
        title: 'Success',
        description: 'Class and all associated data have been deleted',
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const handleCsvImport = async (importedStudents: Omit<Student, 'id'>[], updateExisting: boolean) => {
    const updatedStudents = [...students];
    let newCount = 0;
    let updateCount = 0;
    const failures: { student: string; reason: string }[] = [];

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
              failures.push({
                student: `${importedStudent.fullName} (${importedStudent.studentId})`,
                reason: error.message || 'Unknown error'
              });
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
            failures.push({
              student: `${importedStudent.fullName} (${importedStudent.studentId})`,
              reason: error.message || 'Unknown error'
            });
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
      
      // Show detailed results
      if (failures.length === 0) {
        toast({
          title: "Import Complete",
          description: `Successfully added ${newCount} new students${updateCount > 0 ? ` and updated ${updateCount} existing students` : ''}.`,
        });
      } else {
        const successCount = newCount + updateCount;
        console.log('Failed imports:', failures);
        toast({
          title: "Import Partially Complete",
          description: `Successfully imported ${successCount} students. ${failures.length} students failed to import. Check console for details.`,
          variant: failures.length > successCount ? 'destructive' : 'default',
        });
      }
    } catch (error) {
      console.error('Error importing students:', error);
      toast({
        title: 'Error',
        description: 'Failed to import students',
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
      {isMobile ? (
        <>
          <MobileHeader 
            selectedDate={selectedDate}
            onSignOut={signOut}
            userName={profile?.full_name || profile?.email}
          />
          <main className="px-4 pb-6 space-y-4">
            {/* Mobile Class and Date Selector */}
            <Card className="p-4 bg-gradient-mobile space-y-3">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <ClassSelector 
                    classes={classes}
                    selectedClassId={selectedClassId}
                    onSelectClass={setSelectedClassId}
                    onDeleteClass={handleDeleteClass}
                    loading={loading}
                  />
                </div>
                <Button
                  onClick={() => setShowAddClass(true)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  New Class
                </Button>
              </div>
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </Card>

            {/* Mobile Summary */}
            <DailySummary
              students={students}
              attendanceRecords={attendanceRecords}
              selectedDate={selectedDateString}
            />

            {/* Main Content */}
            <StudentList
              students={students}
              attendanceRecords={attendanceRecords}
              selectedDate={selectedDateString}
              onAttendanceChange={handleAttendanceChange}
              onBulkAttendanceChange={handleBulkAttendanceChange}
              onDeleteAttendance={handleDeleteAttendance}
              onAddStudent={() => setShowAddStudent(true)}
              onImportStudents={() => setShowCsvImport(true)}
              onDeleteStudent={handleDeleteStudent}
              onUpdateNote={handleUpdateNote}
            />
          </main>
        </>
      ) : (
        <>
          {/* Desktop Header */}
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
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex gap-2 items-center">
                    <ClassSelector 
                      classes={classes}
                      selectedClassId={selectedClassId}
                      onSelectClass={setSelectedClassId}
                      onDeleteClass={handleDeleteClass}
                      loading={loading}
                    />
                    <Button
                      onClick={() => setShowAddClass(true)}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      New Class
                    </Button>
                  </div>
                  <DateSelector 
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />
                </div>
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
                    onDeleteStudent={handleDeleteStudent}
                    onUpdateNote={handleUpdateNote}
                  />
              </div>
            </Card>

            <RoleManagement />
          </div>
        </>
      )}

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={showAddStudent}
        onOpenChange={setShowAddStudent}
        onAddStudent={handleAddStudent}
        existingStudentIds={students.map(s => s.studentId)}
        classes={classes}
        selectedClassId={selectedClassId}
      />

      {/* Add Class Dialog */}
      <AddClassDialog
        open={showAddClass}
        onOpenChange={setShowAddClass}
        onAddClass={handleAddClass}
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
