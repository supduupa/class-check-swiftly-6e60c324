import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Link2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StudentLinkFormProps {
  onLinked: () => void;
}

export default function StudentLinkForm({ onLinked }: StudentLinkFormProps) {
  const { user, signOut } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studentId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Look up the student record by student_id
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('id, user_id, class_id')
        .eq('student_id', studentId.trim())
        .maybeSingle();

      if (fetchError) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (!student) {
        setError('Student ID not recognized. Please check and try again.');
        setLoading(false);
        return;
      }

      if (student.user_id) {
        setError('This Student ID is already linked to an account.');
        setLoading(false);
        return;
      }

      // Link the student record to the current user
      const { error: updateError } = await supabase
        .from('students')
        .update({ user_id: user.id })
        .eq('student_id', studentId.trim());

      if (updateError) {
        if (updateError.message?.includes('row-level security')) {
          setError('Permission denied. Please contact your instructor.');
        } else {
          setError('Failed to link your account. Please try again.');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onLinked(), 1500);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Link2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Link Your Account</CardTitle>
          <CardDescription>
            Enter the Student ID provided by your instructor to connect to your class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                You have been assigned to your class! Redirecting…
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="e.g. STU-001"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !studentId.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking…
                  </>
                ) : (
                  'Link My Account'
                )}
              </Button>

              <Button type="button" variant="ghost" className="w-full gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
