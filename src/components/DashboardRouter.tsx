import { useAuth } from '@/hooks/useAuth';
import { isStaff } from '@/types/profile';
import StudentDashboard from '@/components/StudentDashboard';
import StaffDashboard from '@/components/StaffDashboard';
import { GraduationCap } from 'lucide-react';

export default function DashboardRouter() {
  const { profile, loading } = useAuth();

  if (loading) {
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
  } else {
    return <StudentDashboard />;
  }
}