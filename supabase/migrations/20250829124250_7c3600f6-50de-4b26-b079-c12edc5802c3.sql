-- Create profiles for existing users who don't have them
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
SELECT 
  u.id,
  'Student'::app_role as role,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  u.created_at,
  u.created_at as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Also make sure the trigger exists
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();