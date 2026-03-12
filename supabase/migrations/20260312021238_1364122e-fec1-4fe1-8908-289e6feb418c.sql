-- Fix recursive profiles RLS policy causing "infinite recursion detected"

-- Helper function evaluated in policy context without recursive RLS evaluation
CREATE OR REPLACE FUNCTION public.is_staff_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('Teacher'::app_role, 'CourseRep'::app_role)
  );
$$;

-- Remove recursive policy and duplicate own-profile policy
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

-- Recreate staff policy safely using security definer function
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_staff_user(auth.uid()));