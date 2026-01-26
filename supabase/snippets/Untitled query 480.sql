ALTER TABLE trips
ALTER COLUMN traveler_user_id
SET DEFAULT auth.uid();
