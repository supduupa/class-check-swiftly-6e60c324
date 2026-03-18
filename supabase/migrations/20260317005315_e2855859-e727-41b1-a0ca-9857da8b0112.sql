
-- Drop overly permissive policies on students table
DROP POLICY IF EXISTS "Authenticated can read students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can delete students" ON public.students;

-- Drop overly permissive policies on attendance table
DROP POLICY IF EXISTS "Authenticated can read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can delete attendance" ON public.attendance;

-- =====================
-- STUDENTS table policies
-- =====================

-- Teachers can manage students in their own classes
CREATE POLICY "Teachers manage their class students"
ON public.students FOR ALL TO authenticated
USING (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
)
WITH CHECK (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
);

-- Students can view classmates in their own class
CREATE POLICY "Students view own class students"
ON public.students FOR SELECT TO authenticated
USING (
  class_id = public.get_user_class_id(auth.uid())
);

-- =====================
-- ATTENDANCE table policies
-- =====================

-- Teachers can manage attendance in their own classes
CREATE POLICY "Teachers manage class attendance"
ON public.attendance FOR ALL TO authenticated
USING (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
)
WITH CHECK (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
);

-- CourseReps can manage attendance in their assigned class
CREATE POLICY "CourseReps manage class attendance"
ON public.attendance FOR ALL TO authenticated
USING (
  public.is_staff_user(auth.uid()) AND class_id = public.get_user_class_id(auth.uid())
)
WITH CHECK (
  public.is_staff_user(auth.uid()) AND class_id = public.get_user_class_id(auth.uid())
);

-- Students can insert their own attendance (for QR code marking)
CREATE POLICY "Students insert own attendance"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  AND class_id = public.get_user_class_id(auth.uid())
);
