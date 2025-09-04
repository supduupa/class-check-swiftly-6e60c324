-- Update nana yaw's role to Teacher
UPDATE public.profiles 
SET role = 'Teacher' 
WHERE full_name ILIKE '%nana yaw%' OR email = 'josephnyamaah1@gmail.com';