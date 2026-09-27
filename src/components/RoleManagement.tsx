import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { Profile, AppRole } from '@/types/profile';

export default function RoleManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive",
        });
        return;
      }

      // Re-fetch from database to ensure UI reflects persisted state
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError || !updatedProfile) {
        toast({
          title: "Warning",
          description: "Role updated but failed to refresh. Please reload.",
          variant: "destructive",
        });
        return;
      }

      setUsers(users.map(user => 
        user.id === userId ? updatedProfile : user
      ));

      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'Teacher':
        return 'default';
      case 'CourseRep':
        return 'secondary';
      case 'Student':
        return 'outline';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Role Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                  <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value: AppRole) => updateUserRole(user.id, value)}
                  disabled={updating === user.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="CourseRep">Course Rep</SelectItem>
                  </SelectContent>
                </Select>
                
                {updating === user.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}