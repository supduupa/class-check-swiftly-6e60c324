-- Improve the RLS policy for students to be more flexible with name matching
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;

CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN students s ON (
      -- More flexible name matching - handle variations like "Joseph nyamaah" vs "josephnyamaah30"
      LOWER(TRIM(BOTH FROM REPLACE(p.full_name, ' ', ''))) = LOWER(TRIM(BOTH FROM REPLACE(s.full_name, ' ', '')))
      OR LOWER(TRIM(BOTH FROM p.full_name)) LIKE LOWER(TRIM(BOTH FROM s.full_name)) || '%'
      OR LOWER(TRIM(BOTH FROM s.full_name)) LIKE LOWER(TRIM(BOTH FROM p.full_name)) || '%'
      OR LOWER(TRIM(BOTH FROM REPLACE(s.full_name, ' ', ''))) LIKE LOWER(TRIM(BOTH FROM REPLACE(p.full_name, ' ', ''))) || '%'
    )
    WHERE p.id = auth.uid() 
    AND p.role = 'Student'
    AND s.id = attendance.student_id
  )
);

-- Also improve the students table RLS policy for the same reason
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'Student'
    AND (
      LOWER(TRIM(BOTH FROM REPLACE(p.full_name, ' ', ''))) = LOWER(TRIM(BOTH FROM REPLACE(students.full_name, ' ', '')))
      OR LOWER(TRIM(BOTH FROM p.full_name)) LIKE LOWER(TRIM(BOTH FROM students.full_name)) || '%'
      OR LOWER(TRIM(BOTH FROM students.full_name)) LIKE LOWER(TRIM(BOTH FROM p.full_name)) || '%'
      OR LOWER(TRIM(BOTH FROM REPLACE(students.full_name, ' ', ''))) LIKE LOWER(TRIM(BOTH FROM REPLACE(p.full_name, ' ', ''))) || '%'
    )
  )
);