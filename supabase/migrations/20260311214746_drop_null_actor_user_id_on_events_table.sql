BEGIN;

-- Allow system generated events (like REQUEST_EXPIRED)
-- to have no actor user
ALTER TABLE public.carry_request_events
ALTER COLUMN actor_user_id DROP NOT NULL;

COMMIT;