-- Allow students to link themselves by updating user_id on unlinked student records
CREATE POLICY "Students can link own account"
ON public.students FOR UPDATE TO authenticated
USING (user_id IS NULL)
WITH CHECK (user_id = auth.uid());

-- Allow students to read student records to look up by student_id
CREATE POLICY "Authenticated users can lookup students by student_id"
ON public.students FOR SELECT TO authenticated
USING (user_id IS NULL OR user_id = auth.uid());