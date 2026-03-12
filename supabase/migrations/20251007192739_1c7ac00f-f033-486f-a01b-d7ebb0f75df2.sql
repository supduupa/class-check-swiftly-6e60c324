-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Staff can view all classes" ON public.classes
FOR SELECT USING (is_staff_user());

CREATE POLICY "Teachers can view their own classes" ON public.classes
FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Staff can insert classes" ON public.classes
FOR INSERT WITH CHECK (is_staff_user());

CREATE POLICY "Teachers can update their own classes" ON public.classes
FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Staff can delete classes" ON public.classes
FOR DELETE USING (is_staff_user());

-- Add class_id to students table
ALTER TABLE public.students ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add class_id to attendance table
ALTER TABLE public.attendance ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Create trigger for classes updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS for students to allow viewing classmates
CREATE POLICY "Students can view classmates" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid() AND s.class_id = students.class_id
  )
);

-- Update RLS for attendance to allow viewing class attendance
CREATE POLICY "Students can view class attendance" ON public.attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid() AND s.class_id = attendance.class_id
  )
);