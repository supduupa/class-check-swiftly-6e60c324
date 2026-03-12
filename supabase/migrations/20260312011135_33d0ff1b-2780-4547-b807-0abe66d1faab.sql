
-- Fix profiles RLS: Drop all restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;

-- Create PERMISSIVE policies (the default)
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('Teacher', 'CourseRep'))
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Fix attendance RLS: make permissive
DROP POLICY IF EXISTS "Authenticated can read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated can delete attendance" ON public.attendance;

CREATE POLICY "Authenticated can read attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);

-- Fix classes RLS: make permissive
DROP POLICY IF EXISTS "Authenticated can read classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can update classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated can delete classes" ON public.classes;

CREATE POLICY "Authenticated can read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update classes" ON public.classes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete classes" ON public.classes FOR DELETE TO authenticated USING (true);

-- Fix students RLS: make permissive
DROP POLICY IF EXISTS "Authenticated can read students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can delete students" ON public.students;

CREATE POLICY "Authenticated can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete students" ON public.students FOR DELETE TO authenticated USING (true);

-- Recreate trigger for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    'Student'::app_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles
INSERT INTO public.profiles (id, full_name, email, role)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'User'), u.email, 'Teacher'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
