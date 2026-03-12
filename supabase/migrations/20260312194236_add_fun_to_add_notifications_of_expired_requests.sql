BEGIN;

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
      cr.sender_user_id,
      cr.traveler_user_id,
      COALESCE((cr.parcel_snapshot ->> 'weight_kg')::numeric, 0) AS reserved_weight
  ),

  -- release reserved trip weight
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

  -- insert expiry event
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
  ),

  -- sender notifications
  sender_notifications AS (
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    SELECT
      e.sender_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      NULL
    FROM expired_rows e
    JOIN LATERAL get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'SENDER',
      'TRAVELER'
    ) tpl ON true
  ),

  -- traveler notifications
  traveler_notifications AS (
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    SELECT
      e.traveler_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      NULL
    FROM expired_rows e
    JOIN LATERAL get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'TRAVELER',
      'SENDER'
    ) tpl ON true
  )

  SELECT COUNT(*) INTO expired_count
  FROM expired_rows;

  RETURN expired_count;
END;
$$;

COMMIT;