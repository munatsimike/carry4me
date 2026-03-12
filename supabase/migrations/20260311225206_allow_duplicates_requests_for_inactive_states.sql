BEGIN;

-- 1. Drop the old unique constraint
ALTER TABLE public.carry_requests
DROP CONSTRAINT carry_requests_trip_id_parcel_id_key;

-- 2. Create a partial unique index that only blocks active requests
CREATE UNIQUE INDEX carry_requests_active_trip_parcel_idx
ON public.carry_requests (trip_id, parcel_id)
WHERE status IN (
  'PENDING_ACCEPTANCE',
  'PENDING_PAYMENT',
  'PENDING_HANDOVER',
  'IN_TRANSIT',
  'PENDING_PAYOUT'
);

COMMIT;