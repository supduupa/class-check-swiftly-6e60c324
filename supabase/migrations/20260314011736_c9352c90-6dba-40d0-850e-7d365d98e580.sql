
-- Drop the recursive policy
DROP POLICY IF EXISTS "Reps manage their class students" ON public.students;

-- Create a security definer function to get the class_id for a user without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_class_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id FROM public.students WHERE user_id = _user_id LIMIT 1;
$$;

-- Recreate the policy using the function instead of a subquery on students
CREATE POLICY "Reps manage their class students"
ON public.students
FOR ALL
TO public
USING (class_id = public.get_user_class_id(auth.uid()))
WITH CHECK (class_id = public.get_user_class_id(auth.uid()));
