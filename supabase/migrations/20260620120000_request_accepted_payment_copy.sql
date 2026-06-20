update public.carry_request_notification_templates
set body = 'The traveler accepted your request to carry your parcel. Make payment to continue. Your payment will be held securely until delivery is complete.'
where type = 'REQUEST_ACCEPTED'
  and recipient_role = 'SENDER'
  and actor_role = 'TRAVELER';
