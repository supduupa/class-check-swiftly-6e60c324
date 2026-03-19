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

  const handleLinked = useCallback(() => {
    setClassCheckLoading(true);
    // Re-check class assignment after linking
    const recheck = async () => {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile?.id)
        .limit(1)
        .maybeSingle();
      setHasClass(!!data);
      setClassCheckLoading(false);
    };
    recheck();
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

  // Student with no class — show self-link form
  if (!hasClass) {
    return <StudentLinkForm onLinked={handleLinked} />;
  }

  return <StudentDashboard />;
}