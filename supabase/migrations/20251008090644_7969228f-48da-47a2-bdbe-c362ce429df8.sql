-- Create a security definer function to get user's class_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_class_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id 
  FROM public.students 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Students can view classmates" ON public.students;
DROP POLICY IF EXISTS "Students can view class attendance" ON public.attendance;

-- Recreate the policies using the security definer function to avoid recursion
CREATE POLICY "Students can view classmates"
ON public.students
FOR SELECT
USING (
  class_id IS NOT NULL 
  AND class_id = public.get_user_class_id()
);

CREATE POLICY "Students can view class attendance"
ON public.attendance
FOR SELECT
USING (
  class_id IS NOT NULL 
  AND class_id = public.get_user_class_id()
);