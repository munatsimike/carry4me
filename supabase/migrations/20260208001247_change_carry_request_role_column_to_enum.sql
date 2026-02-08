BEGIN;

-- Drop old CHECK (if it exists)
ALTER TABLE carry_requests
DROP CONSTRAINT IF EXISTS carry_requests_initiator_role_check;

-- Create enum type
CREATE TYPE carry_request_initiator_role AS ENUM ('SENDER', 'TRAVELER');

-- Convert column to enum
ALTER TABLE carry_requests
ALTER COLUMN initiator_role TYPE carry_request_initiator_role
USING initiator_role::carry_request_initiator_role;

ALTER TABLE carry_requests
ALTER COLUMN initiator_role SET NOT NULL;


COMMIT;
