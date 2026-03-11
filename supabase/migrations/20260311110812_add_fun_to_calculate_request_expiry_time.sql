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
    UPDATE public.carry_requests
    SET
      status = 'EXPIRED',
      expired_at = now(),
      payment_expires_at = NULL,
      updated_at = now()
    WHERE status = 'PENDING_PAYMENT'
      AND payment_expires_at IS NOT NULL
      AND payment_expires_at <= now()
    RETURNING id
  ),
  inserted_events AS (
    INSERT INTO public.carry_request_events (
      carry_request_id,
      type,
      actor_user_id,
      metadata
    )
    SELECT
      id,
      'REQUEST_EXPIRED',
      NULL,
      '{}'::jsonb
    FROM expired_rows
    RETURNING 1
  )
  SELECT COUNT(*) INTO expired_count
  FROM inserted_events;

  RETURN expired_count;
END;
$$;