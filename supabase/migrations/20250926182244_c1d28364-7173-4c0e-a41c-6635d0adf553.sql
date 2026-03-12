-- Allow staff users (Teachers and CourseReps) to update any user's profile for role management
CREATE POLICY "Staff can update any user profile" 
ON public.profiles 
FOR UPDATE 
USING (is_staff_user());

-- Allow staff users to view all profiles for role management
CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_staff_user());