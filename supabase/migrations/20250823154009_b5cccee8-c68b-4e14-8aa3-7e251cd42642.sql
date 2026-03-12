-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Excused');

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'Absent',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
CREATE POLICY "Users can view all students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update students" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can delete students" 
ON public.students 
FOR DELETE 
TO authenticated
USING (true);

-- Create RLS policies for attendance table
CREATE POLICY "Users can view all attendance" 
ON public.attendance 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert attendance" 
ON public.attendance 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update attendance" 
ON public.attendance 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can delete attendance" 
ON public.attendance 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();