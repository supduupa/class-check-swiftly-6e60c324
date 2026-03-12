-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  role public.app_role NOT NULL DEFAULT 'Student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'Absent',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email,
    'Student'
  );
  RETURN NEW;
END;
$$;

-- Create get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Create is_staff_user function
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Teacher', 'CourseRep')
  );
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_staff_user());

DROP POLICY IF EXISTS "Staff can update any user profile" ON public.profiles;
CREATE POLICY "Staff can update any user profile"
  ON public.profiles FOR UPDATE
  USING (is_staff_user());

DROP POLICY IF EXISTS "Users can create their own profile as Student" ON public.profiles;
CREATE POLICY "Users can create their own profile as Student"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'Student');

DROP POLICY IF EXISTS "Staff can create any profile" ON public.profiles;
CREATE POLICY "Staff can create any profile"
  ON public.profiles FOR INSERT
  WITH CHECK (is_staff_user());

-- RLS Policies for students
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
CREATE POLICY "Staff can view all students"
  ON public.students FOR SELECT
  USING (is_staff_user());

DROP POLICY IF EXISTS "Students can view their own record by user_id" ON public.students;
CREATE POLICY "Students can view their own record by user_id"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
CREATE POLICY "Staff can insert students"
  ON public.students FOR INSERT
  WITH CHECK (is_staff_user());

DROP POLICY IF EXISTS "Staff can update students" ON public.students;
CREATE POLICY "Staff can update students"
  ON public.students FOR UPDATE
  USING (is_staff_user());

DROP POLICY IF EXISTS "Staff can delete students" ON public.students;
CREATE POLICY "Staff can delete students"
  ON public.students FOR DELETE
  USING (is_staff_user());

-- RLS Policies for attendance
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
CREATE POLICY "Staff can view all attendance"
  ON public.attendance FOR SELECT
  USING (is_staff_user());

DROP POLICY IF EXISTS "Students can view their own attendance by user_id" ON public.attendance;
CREATE POLICY "Students can view their own attendance by user_id"
  ON public.attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = attendance.student_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Staff can insert/update attendance" ON public.attendance;
CREATE POLICY "Staff can insert/update attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (is_staff_user());

DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance;
CREATE POLICY "Staff can update attendance"
  ON public.attendance FOR UPDATE
  USING (is_staff_user());

DROP POLICY IF EXISTS "Staff can delete attendance" ON public.attendance;
CREATE POLICY "Staff can delete attendance"
  ON public.attendance FOR DELETE
  USING (is_staff_user());