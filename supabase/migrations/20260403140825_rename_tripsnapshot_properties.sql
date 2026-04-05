-- up

BEGIN;

UPDATE carry_requests
SET trip_snapshot =
  (
    trip_snapshot
      - 'travelerName'
      - 'departureDate'
  )
  ||
  CASE
    WHEN trip_snapshot ? 'travelerName'
    THEN jsonb_build_object('traveler_name', trip_snapshot->'travelerName')
    ELSE '{}'::jsonb
  END
  ||
  CASE
    WHEN trip_snapshot ? 'departureDate'
    THEN jsonb_build_object('departure_date', trip_snapshot->'departureDate')
    ELSE '{}'::jsonb
  END
WHERE trip_snapshot ? 'travelerName'
   OR trip_snapshot ? 'departureDate';

COMMIT;