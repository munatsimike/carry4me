-- Payment-completed emails: sender contact details for traveler handover,
-- and clearer copy for the paying sender.

update public.carry_request_notification_templates
set
  title = 'Payment received',
  body = 'The sender has paid for this carry request. Please arrange handover and collect the parcel.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set
  title = 'Payment completed',
  body = 'Your payment was successful. Please arrange handover with the traveler and update your request when you are ready.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'SENDER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set body = 'Both parties confirmed handover. The parcel is now in transit.'
where type = 'PARCEL_RECEIVED';
