import { useAuth } from '@/hooks/useAuth';
import { isStaff } from '@/types/profile';
import Index from '@/pages/Index';

// Staff (Teacher/CourseRep) see the existing full functionality
export default function StaffDashboard() {
  const { profile } = useAuth();

  if (!profile || !isStaff(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Access denied. Staff role required.</p>
        </div>
      </div>
    );
  }

  return <Index />;
}