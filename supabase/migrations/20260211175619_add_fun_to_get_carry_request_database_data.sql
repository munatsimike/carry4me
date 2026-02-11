CREATE OR REPLACE FUNCTION get_carry_request_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(
    'total_matches', COUNT(*) FILTER (WHERE status != 'PENDING_ACCEPTANCE'),
    'pending_matches', COUNT(*) FILTER (WHERE status = 'PENDING_ACCEPTANCE'),
    'pending_payment', COUNT(*) FILTER (WHERE status = 'PENDING_PAYMENT'),
    'pending_handover', COUNT(*) FILTER (WHERE status = 'PENDING_HANDOVER'),
    'in_transit', COUNT(*) FILTER (WHERE status = 'IN_TRANSIT'),
    'pending_payout', COUNT(*) FILTER (WHERE status = 'PENDING_PAYOUT'),
    'completed', COUNT(*) FILTER (WHERE status = 'PAID_OUT')
  )
  FROM carry_requests
  WHERE sender_user_id = p_user_id
     OR traveler_user_id = p_user_id;
$$;
