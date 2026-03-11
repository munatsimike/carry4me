BEGIN;

-- 1. Create enum type if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'parcel_status'
  ) THEN
    CREATE TYPE public.parcel_status AS ENUM (
      'OPEN',
      'MATCHED',
      'ARCHIVED'
    );
  END IF;
END
$$;

-- 2. Drop old constraint if it exists
ALTER TABLE public.parcels
DROP CONSTRAINT IF EXISTS parcels_status_check;

-- 3. Drop old default (important for enum conversion)
ALTER TABLE public.parcels
ALTER COLUMN status DROP DEFAULT;

-- 4. Normalize existing values
UPDATE public.parcels
SET status = UPPER(status)
WHERE status IS NOT NULL;

-- 5. Convert unexpected values to ARCHIVED
UPDATE public.parcels
SET status = 'ARCHIVED'
WHERE status NOT IN ('OPEN','MATCHED','ARCHIVED');

-- 6. Convert column type
ALTER TABLE public.parcels
ALTER COLUMN status TYPE public.parcel_status
USING status::public.parcel_status;

-- 7. Set default
ALTER TABLE public.parcels
ALTER COLUMN status SET DEFAULT 'OPEN';

COMMIT;