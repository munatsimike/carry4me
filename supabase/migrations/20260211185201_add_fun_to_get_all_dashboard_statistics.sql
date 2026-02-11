CREATE OR REPLACE FUNCTION get_dashboard_overview(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(

    -- Posted Items
    'total_posted_parcels',
      (SELECT COUNT(*) FROM parcels WHERE sender_user_id = p_user_id),

    'total_posted_trips',
      (SELECT COUNT(*) FROM trips WHERE traveler_user_id = p_user_id),

    -- Carry Request Lifecycle
    'total_requests',
      (SELECT COUNT(*) FROM carry_requests
       WHERE sender_user_id = p_user_id
          OR traveler_user_id = p_user_id),

    'pending_matches',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'PENDING_ACCEPTANCE'),

    'pending_payment',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'PENDING_PAYMENT'),

    'pending_handover',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'PENDING_HANDOVER'),

    'in_transit',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'IN_TRANSIT'),

    'pending_payout',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'PENDING_PAYOUT'),

    'completed',
      (SELECT COUNT(*) FROM carry_requests
       WHERE (sender_user_id = p_user_id OR traveler_user_id = p_user_id)
         AND status = 'PAID_OUT')

  );
$$;
