-- Create a student record for CourseRep James Atsem linked to IT8 class
-- This allows the CourseRep to access and manage their class

INSERT INTO students (
  full_name,
  student_id,
  email,
  user_id,
  class_id
) VALUES (
  'James Atsem',
  'CR-10000001',  -- CourseRep student ID
  'josephnyamaah1@gmail.com',
  '5cc6adb0-7bdf-48ec-ac1e-b9c60e5067e8',  -- James's auth user_id
  '5c7ffed6-975b-4bff-8ca9-0da461667301'   -- IT8 class
)
ON CONFLICT (student_id) DO UPDATE
SET 
  user_id = EXCLUDED.user_id,
  class_id = EXCLUDED.class_id,
  email = EXCLUDED.email;