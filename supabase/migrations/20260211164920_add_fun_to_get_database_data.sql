CREATE OR REPLACE FUNCTION get_trip_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(
    'posted', COUNT(*),
    'pending_metches', COUNT(*) FILTER (WHERE status = 'PENDING_ACCEPTENCE'),
    'pending_handover', COUNT(*) FILTER (WHERE status = 'PENDING_HANDOVER'),
    'in_transit', COUNT(*) FILTER (WHERE status = 'IN_TRANSIT'),
    'paid_out', COUNT(*) FILTER (WHERE status = 'PAID_OUT')
  )
  FROM carry_requests
  WHERE traveler_user_id = p_user_id;
$$;
