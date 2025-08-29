-- Create a student profile that matches an existing student record
INSERT INTO public.profiles (id, full_name, role)
VALUES (
  'test-student-id',
  'Joseph nyamaah',
  'Student'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Also let's improve the RLS policy for students to be more flexible with name matching
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;

CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN students s ON (
      -- More flexible name matching
      LOWER(TRIM(p.full_name)) = LOWER(TRIM(s.full_name))
      OR LOWER(TRIM(p.full_name)) LIKE LOWER(TRIM(s.full_name)) || '%'
      OR LOWER(TRIM(s.full_name)) LIKE LOWER(TRIM(p.full_name)) || '%'
    )
    WHERE p.id = auth.uid() 
    AND p.role = 'Student'
    AND s.id = attendance.student_id
  )
);