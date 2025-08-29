-- Update the current user's role to Teacher to access staff features
UPDATE profiles 
SET role = 'Teacher'::app_role, updated_at = now()
WHERE id = 'f2e978a5-9bc1-4f26-941c-eeea90658a96';