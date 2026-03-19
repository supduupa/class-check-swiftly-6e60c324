import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isStaff } from '@/types/profile';
import StudentDashboard from '@/components/StudentDashboard';
import StaffDashboard from '@/components/StaffDashboard';
import StudentLinkForm from '@/components/StudentLinkForm';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function DashboardRouter() {
  const { profile, loading, signOut } = useAuth();
  const [classCheckLoading, setClassCheckLoading] = useState(true);
  const [hasClass, setHasClass] = useState(false);

  useEffect(() => {
    if (!profile || isStaff(profile.role)) {
      setClassCheckLoading(false);
      return;
    }

    // For Student role, check if they're assigned to a class
    const checkClassAssignment = async () => {
      const { data } = await supabase
        .from('students')
        .select('id')
        .limit(1)
        .maybeSingle();

      setHasClass(!!data);
      setClassCheckLoading(false);
    };

    checkClassAssignment();
  }, [profile]);

  if (loading || classCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <GraduationCap className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Profile not found. Please try signing in again.</p>
        </div>
      </div>
    );
  }

  // Route based on user role
  if (isStaff(profile.role)) {
    return <StaffDashboard />;
  }

  // Student with no class assignment
  if (!hasClass) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">No Class Assigned</h1>
            <p className="text-muted-foreground">
              You haven't been assigned to a class yet. Please contact your instructor to get added to a class.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Once your instructor adds you to a class, you'll be able to view your attendance records here.
          </p>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <StudentDashboard />;
}