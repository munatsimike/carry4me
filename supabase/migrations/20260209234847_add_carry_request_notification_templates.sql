BEGIN;

-- 1) Templates table
CREATE TABLE IF NOT EXISTS carry_request_notification_templates (
  type text NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('SENDER','TRAVELER')),
  actor_role text NOT NULL CHECK (actor_role IN ('SENDER','TRAVELER')),
  title text NOT NULL,
  body text NOT NULL,
  link text NOT NULL DEFAULT '/requests',
  PRIMARY KEY (type, recipient_role, actor_role)
);

-- 2) Helper function the RPC calls
CREATE OR REPLACE FUNCTION get_carry_request_notification_template(
  p_type text,
  p_recipient_role text,
  p_actor_role text
)
RETURNS TABLE (title text, body text, link text)
LANGUAGE sql
STABLE
AS $$
  SELECT t.title, t.body, t.link
  FROM carry_request_notification_templates t
  WHERE t.type = p_type
    AND t.recipient_role = p_recipient_role
    AND t.actor_role = p_actor_role;
$$;

COMMIT;

INSERT INTO carry_request_notification_templates (type, recipient_role, actor_role, title, body)
VALUES
('REQUEST_ACCEPTED','TRAVELER','SENDER','Request accepted','The sender accepted your request to carry their parcel on your trip.'),
('REQUEST_ACCEPTED','SENDER','TRAVELER','Request accepted','The traveler accepted your request to carry your parcel.'),
('REQUEST_REJECTED','TRAVELER','SENDER','Request rejected','The sender rejected your request.'),
('REQUEST_REJECTED','SENDER','TRAVELER','Request rejected','The traveler rejected your request.'),
('REQUEST_CANCELED','TRAVELER','SENDER','Request cancelled','The sender cancelled the request.'),
('REQUEST_CANCELED','SENDER','TRAVELER','Request cancelled','The traveler cancelled the request (trip changed).'),
('PAYMENT_COMPLETED','TRAVELER','SENDER','Payment completed','Payment was completed. Please proceed to handover.'),
('PARCEL_RECEIVED','TRAVELER','SENDER','Handover confirmed','Both parties confirmed handover. The parcel is now in transit.'),
('PARCEL_RECEIVED','SENDER','TRAVELER','Handover confirmed','Both parties confirmed handover. The parcel is now in transit.'),
('PARCEL_DELIVERED','TRAVELER','SENDER','Parcel delivered','The parcel was marked as delivered.'),
('PARCEL_DELIVERED','SENDER','TRAVELER','Parcel delivered','The parcel was marked as delivered.'),
('PAYMENT_RELEASED','TRAVELER','SENDER','Payment released','Payment has been released.'),
('PAYMENT_RELEASED','SENDER','TRAVELER','Payment released','Payment has been released.')
ON CONFLICT DO NOTHING;
