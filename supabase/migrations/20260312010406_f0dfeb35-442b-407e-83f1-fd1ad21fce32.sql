-- Grant admin/staff access for the currently signed-in account
UPDATE public.profiles
SET role = 'Teacher'::app_role,
    updated_at = now()
WHERE id = 'adad42b8-38e6-4e25-9cd6-e3f6c09cfbf0';