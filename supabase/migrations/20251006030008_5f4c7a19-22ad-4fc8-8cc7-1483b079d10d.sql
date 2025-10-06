-- Add user_id column to students table to link student records to user accounts
ALTER TABLE public.students 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_students_user_id ON public.students(user_id);

-- Drop the insecure name-matching policies
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;

-- Create secure policies using user_id
CREATE POLICY "Students can view their own record by user_id"
ON public.students
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Students can view their own attendance by user_id"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
    AND s.user_id = auth.uid()
  )
);