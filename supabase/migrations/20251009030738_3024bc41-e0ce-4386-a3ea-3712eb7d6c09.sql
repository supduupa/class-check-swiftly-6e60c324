
-- Assign all unassigned students to IT8 (the first class)
UPDATE students
SET class_id = '5c7ffed6-975b-4bff-8ca9-0da461667301'
WHERE class_id IS NULL;
