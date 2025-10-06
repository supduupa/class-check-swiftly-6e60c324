import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, User, Mail, Phone, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Student, Attendance, AttendanceStatus } from '@/types/attendance';
import { useToast } from '@/hooks/use-toast';

interface AttendanceWithDate extends Attendance {
  date: string;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchStudentData();
      fetchAttendanceHistory();
    }
  }, [profile]);

  const fetchStudentData = async () => {
    if (!profile) return;

    try {
      // RLS policies will automatically filter to show only the student record
      // where user_id matches the authenticated user
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load student information',
          variant: 'destructive',
        });
        return;
      }

      setStudentData(data ? {
        id: data.id,
        fullName: data.full_name,
        studentId: data.student_id,
        email: data.email,
        phone: data.phone
      } : null);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!profile) return;

    try {
      // RLS policies will automatically filter to show only attendance records
      // for the student whose user_id matches the authenticated user
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          note,
          student_id
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance history',
          variant: 'destructive',
        });
        return;
      }

      setAttendanceHistory((data || []).map(record => ({
        id: record.id,
        studentId: record.student_id,
        date: record.date,
        status: record.status,
        note: record.note
      })));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceHistory.length;
    if (total === 0) return { total: 0, present: 0, percentage: 0 };

    const present = attendanceHistory.filter(record => record.status === 'Present').length;
    const percentage = Math.round((present / total) * 100);

    return { total, present, percentage };
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present': return 'bg-status-present text-status-present-foreground';
      case 'Absent': return 'bg-status-absent text-status-absent-foreground';
      case 'Late': return 'bg-status-late text-status-late-foreground';
      case 'Excused': return 'bg-status-excused text-status-excused-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-foreground">{studentData.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                  <p className="text-foreground">{studentData.studentId}</p>
                </div>
                {studentData.email && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="text-foreground">{studentData.email}</p>
                  </div>
                )}
                {studentData.phone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="text-foreground">{studentData.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No student record found linked to your account. Please contact your instructor to link your account to your student record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold text-status-present">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Classes Attended</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold text-primary">{stats.percentage}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Attendance History
            </CardTitle>
            <CardDescription>
              Your recent attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceHistory.length > 0 ? (
              <div className="space-y-2">
                {attendanceHistory.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {record.note && (
                        <p className="text-sm text-muted-foreground">{record.note}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No attendance records found</p>
                <p className="text-sm text-muted-foreground">
                  Attendance records will appear here once your instructor starts taking attendance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}