
-- Drop overly permissive policies on classes table
DROP POLICY IF EXISTS "Authenticated can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can update classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can delete classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can read classes" ON public.classes;

-- Teachers can manage their own classes
CREATE POLICY "Teachers manage own classes"
ON public.classes FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- CourseReps and Students can view their assigned class
CREATE POLICY "Users view assigned class"
ON public.classes FOR SELECT TO authenticated
USING (id = public.get_user_class_id(auth.uid()));

-- Also clean up duplicate public-role policies on attendance
DROP POLICY IF EXISTS "Students view their attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students insert their attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers view class attendance" ON public.attendance;

-- Clean up duplicate public-role policy on students (already covered by new policies)
DROP POLICY IF EXISTS "Reps manage their class students" ON public.students;
