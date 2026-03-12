-- Create role enum
CREATE TYPE public.app_role AS ENUM ('Teacher', 'CourseRep', 'Student');

-- Create profiles table linked to auth users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'Student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user is staff (Teacher or CourseRep)
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Teacher', 'CourseRep')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update students table RLS policies for role-based access
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- New students policies
CREATE POLICY "Staff can view all students" 
ON public.students 
FOR SELECT 
USING (public.is_staff_user());

CREATE POLICY "Staff can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can update students" 
ON public.students 
FOR UPDATE 
USING (public.is_staff_user());

CREATE POLICY "Staff can delete students" 
ON public.students 
FOR DELETE 
USING (public.is_staff_user());

-- Students can view their own record if they have a matching student_id
CREATE POLICY "Students can view their own record" 
ON public.students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'Student' 
    AND LOWER(TRIM(p.full_name)) = LOWER(TRIM(students.full_name))
  )
);

-- Update attendance table RLS policies
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;

-- New attendance policies
CREATE POLICY "Staff can view all attendance" 
ON public.attendance 
FOR SELECT 
USING (public.is_staff_user());

CREATE POLICY "Staff can insert/update attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can update attendance" 
ON public.attendance 
FOR UPDATE 
USING (public.is_staff_user());

CREATE POLICY "Staff can delete attendance" 
ON public.attendance 
FOR DELETE 
USING (public.is_staff_user());

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.students s ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(s.full_name))
    WHERE p.id = auth.uid() 
    AND p.role = 'Student' 
    AND s.id = attendance.student_id
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    'Student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();