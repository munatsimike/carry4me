BEGIN;

-- 1. Create enum type if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'trip_status'
  ) THEN
    CREATE TYPE public.trip_status AS ENUM (
      'ACTIVE',
      'FULL',
      'ARCHIVED'
    );
  END IF;
END
$$;

-- 2. Drop old check constraint if it exists
ALTER TABLE public.trips
DROP CONSTRAINT IF EXISTS trips_status_check;

-- 3. Add new capacity columns
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS reserved_weight_kg numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_weight_kg numeric NOT NULL DEFAULT 0;

-- 4. Add safety constraints only if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_reserved_weight_positive'
  ) THEN
    ALTER TABLE public.trips
    ADD CONSTRAINT trips_reserved_weight_positive
    CHECK (reserved_weight_kg >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_used_weight_positive'
  ) THEN
    ALTER TABLE public.trips
    ADD CONSTRAINT trips_used_weight_positive
    CHECK (used_weight_kg >= 0);
  END IF;
END
$$;

-- 5. Drop the old text default before converting to enum
ALTER TABLE public.trips
ALTER COLUMN status DROP DEFAULT;

-- 6. Normalize existing status values
UPDATE public.trips
SET status = UPPER(status)
WHERE status IS NOT NULL;

-- 7. Convert old/past statuses if needed
-- Adjust these mappings if your old values differ
UPDATE public.trips
SET status = 'ARCHIVED'
WHERE status NOT IN ('ACTIVE', 'FULL', 'ARCHIVED');

-- 8. Convert the column to enum
ALTER TABLE public.trips
ALTER COLUMN status TYPE public.trip_status
USING status::public.trip_status;

-- 9. Set enum default
ALTER TABLE public.trips
ALTER COLUMN status SET DEFAULT 'ACTIVE';

COMMIT;