CREATE OR REPLACE FUNCTION perform_carry_request_action(
  request_id uuid,
  action_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cr record;

  actor_role text;
  recipient_role text;
  recipient_id uuid;

  next_status text;
  event_type text;

  sender_confirmed boolean;
  traveler_confirmed boolean;

  tpl record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO cr
  FROM carry_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  END IF;

  -- MUST be participant (adjust column names if yours differ)
  IF uid <> cr.sender_user_id AND uid <> cr.traveler_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  END IF;

  actor_role := CASE WHEN uid = cr.sender_user_id THEN 'SENDER' ELSE 'TRAVELER' END;
  recipient_id := CASE WHEN uid = cr.sender_user_id THEN cr.traveler_user_id ELSE cr.sender_user_id END;
  recipient_role := CASE WHEN uid = cr.sender_user_id THEN 'TRAVELER' ELSE 'SENDER' END;

  -- Decide transition (DB owns transitions)
  IF action_key = 'ACCEPT' THEN
    IF cr.status <> 'PENDING_ACCEPTANCE' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'PENDING_PAYMENT';
    event_type := 'REQUEST_ACCEPTED';

  ELSIF action_key = 'REJECT' THEN
    IF cr.status <> 'PENDING_ACCEPTANCE' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'REJECTED';
    event_type := 'REQUEST_REJECTED';

  ELSIF action_key = 'CANCEL' THEN
    IF cr.status NOT IN ('PENDING_ACCEPTANCE','PENDING_PAYMENT','PENDING_HANDOVER') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'CANCELLED';
    event_type := 'REQUEST_CANCELED';

  ELSIF action_key = 'PAY' THEN
    IF cr.status <> 'PENDING_PAYMENT' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'PENDING_HANDOVER';
    event_type := 'PAYMENT_COMPLETED';

  ELSIF action_key = 'CONFIRM_HANDOVER' THEN
    IF cr.status <> 'PENDING_HANDOVER' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;

    -- upsert confirmation (requires UNIQUE(carry_request_id, role))
    INSERT INTO carry_request_handover_confirmations (carry_request_id, user_id, role, confirmed_at)
    VALUES (request_id, uid, actor_role, now())
    ON CONFLICT (carry_request_id, role)
    DO UPDATE SET user_id = EXCLUDED.user_id, confirmed_at = EXCLUDED.confirmed_at;

    SELECT
      COUNT(*) FILTER (WHERE role = 'SENDER') > 0,
      COUNT(*) FILTER (WHERE role = 'TRAVELER') > 0
    INTO sender_confirmed, traveler_confirmed
    FROM carry_request_handover_confirmations
    WHERE carry_request_id = request_id
      AND confirmed_at IS NOT NULL;

    IF NOT (sender_confirmed AND traveler_confirmed) THEN
      RETURN jsonb_build_object(
        'ok', true,
        'action', action_key,
        'progressed', false,
        'waiting_for', CASE WHEN sender_confirmed THEN 'TRAVELER' ELSE 'SENDER' END
      );
    END IF;

    next_status := 'IN_TRANSIT';
    event_type := 'PARCEL_RECEIVED';

  ELSIF action_key = 'MARK_DELIVERED' THEN
    IF cr.status <> 'IN_TRANSIT' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'PENDING_PAYOUT';
    event_type := 'PARCEL_DELIVERED';

  ELSIF action_key = 'RELEASE_PAYMENT' THEN
    IF cr.status <> 'PENDING_PAYOUT' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    END IF;
    next_status := 'PAID_OUT';
    event_type := 'PAYMENT_RELEASED';

  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'NOT_IMPLEMENTED');
  END IF;

  -- Apply transition
  UPDATE carry_requests
  SET status = next_status,
      updated_at = now()
  WHERE id = request_id;

  -- Event log
  INSERT INTO carry_request_events (carry_request_id, type, actor_user_id, metadata)
  VALUES (request_id, event_type, uid, '{}'::jsonb);

  -- Notification text comes from DB templates (not hardcoded here)
  SELECT * INTO tpl
  FROM get_carry_request_notification_template(event_type, recipient_role, actor_role);

  IF tpl.title IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (recipient_id, event_type, tpl.title, tpl.body, tpl.link, NULL);
  ELSE
    -- fallback (in case you forgot to seed a template)
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (recipient_id, event_type, 'Request update', 'Your request was updated.', '/requests', NULL);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'action', action_key,
    'event_type', event_type,
    'new_status', next_status,
    'progressed', true
  );
END;
$$;
