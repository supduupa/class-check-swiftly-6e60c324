-- Add INSERT policies to prevent unauthorized privilege escalation

-- Policy 1: Allow authenticated users to create their own profile ONLY with 'Student' role
CREATE POLICY "Users can create their own profile as Student"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id 
  AND role = 'Student'
);

-- Policy 2: Allow staff members to create any profile (for administrative purposes)
CREATE POLICY "Staff can create any profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_staff_user()
);