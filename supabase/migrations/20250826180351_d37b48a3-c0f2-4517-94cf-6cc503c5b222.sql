-- Fix critical security vulnerability: Update RLS policies to require authentication
-- for both students and attendance tables

-- Drop existing policies for students table
DROP POLICY IF EXISTS "Users can view all students" ON public.students;
DROP POLICY IF EXISTS "Users can insert students" ON public.students;
DROP POLICY IF EXISTS "Users can update students" ON public.students;
DROP POLICY IF EXISTS "Users can delete students" ON public.students;

-- Create secure policies for students table (require authentication)
CREATE POLICY "Authenticated users can view students" 
ON public.students 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update students" 
ON public.students 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete students" 
ON public.students 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Drop existing policies for attendance table
DROP POLICY IF EXISTS "Users can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete attendance" ON public.attendance;

-- Create secure policies for attendance table (require authentication)
CREATE POLICY "Authenticated users can view attendance" 
ON public.attendance 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update attendance" 
ON public.attendance 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete attendance" 
ON public.attendance 
FOR DELETE 
USING (auth.uid() IS NOT NULL);