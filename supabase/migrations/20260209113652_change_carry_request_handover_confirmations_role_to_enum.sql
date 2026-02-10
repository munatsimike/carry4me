BEGIN;

-- 0) Drop any CHECK constraints on this table (so enum cast won't fail)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'carry_request_handover_confirmations'
      AND c.contype = 'c'  -- check constraints
  LOOP
    EXECUTE format(
      'ALTER TABLE carry_request_handover_confirmations DROP CONSTRAINT IF EXISTS %I',
      r.conname
    );
  END LOOP;
END$$;

-- 1) Normalize role values (safe even if table empty)
UPDATE carry_request_handover_confirmations
SET role = UPPER(role)
WHERE role IN ('sender', 'traveler');

-- 2) Create enum type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'handover_role') THEN
    CREATE TYPE handover_role AS ENUM ('SENDER', 'TRAVELER');
  END IF;
END$$;

-- 3) Convert column to enum
ALTER TABLE carry_request_handover_confirmations
ALTER COLUMN role TYPE handover_role
USING role::handover_role;

-- 4) Enforce one confirmation per role per request
ALTER TABLE carry_request_handover_confirmations
ADD CONSTRAINT handover_unique_role_per_request
UNIQUE (carry_request_id, role);

COMMIT;
