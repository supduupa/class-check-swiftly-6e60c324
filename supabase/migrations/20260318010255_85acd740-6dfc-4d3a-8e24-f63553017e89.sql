
-- Allow staff (Teacher/CourseRep) to update any profile's role
CREATE POLICY "Staff can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_staff_user(auth.uid()))
WITH CHECK (is_staff_user(auth.uid()));
