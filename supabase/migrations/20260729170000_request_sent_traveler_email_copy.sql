-- Update REQUEST_SENT traveler notification copy.
update public.carry_request_notification_templates
set body = 'A sender would like you to carry their parcel on your upcoming trip.'
where type = 'REQUEST_SENT'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';
