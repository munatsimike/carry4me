CREATE OR REPLACE FUNCTION public.expire_overdue_carry_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer := 0;
BEGIN
  WITH expired_rows AS (
    UPDATE public.carry_requests cr
    SET
      status = 'EXPIRED',
      expired_at = now(),
      payment_expires_at = NULL,
      updated_at = now()
    WHERE cr.status = 'PENDING_PAYMENT'
      AND cr.payment_expires_at IS NOT NULL
      AND cr.payment_expires_at <= now()
    RETURNING
      cr.id,
      cr.trip_id,
      COALESCE((cr.parcel_snapshot ->> 'weight_kg')::numeric, 0) AS reserved_weight
  ),
  released_trip_weight AS (
    UPDATE public.trips t
    SET
      reserved_weight_kg = GREATEST(0, t.reserved_weight_kg - e.reserved_weight),
      status = CASE
        WHEN (GREATEST(0, t.reserved_weight_kg - e.reserved_weight) + t.used_weight_kg) < t.capacity_kg
          THEN 'ACTIVE'::trip_status
        ELSE t.status
      END,
      updated_at = now()
    FROM expired_rows e
    WHERE t.id = e.trip_id
    RETURNING t.id
  ),
  inserted_events AS (
    INSERT INTO public.carry_request_events (
      carry_request_id,
      type,
      actor_user_id,
      metadata
    )
    SELECT
      e.id,
      'REQUEST_EXPIRED',
      NULL,
      '{}'::jsonb
    FROM expired_rows e
    RETURNING 1
  )
  SELECT COUNT(*) INTO expired_count
  FROM inserted_events;

  RETURN expired_count;
END;
$$;