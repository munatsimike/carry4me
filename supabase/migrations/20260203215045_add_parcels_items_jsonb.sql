ALTER TABLE public.parcels
ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.parcels
DROP COLUMN IF EXISTS description;
