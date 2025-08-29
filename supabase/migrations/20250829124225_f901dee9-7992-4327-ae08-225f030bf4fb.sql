-- Create profiles for existing users who don't have them
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
SELECT 
  u.id,
  'student'::app_role as role,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  u.created_at,
  u.created_at as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Recreate the trigger function to ensure it works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    'student'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;