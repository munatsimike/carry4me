-- Payment-completed emails: no sign-in CTA; handover copy with counterpart contact details.

update public.carry_request_notification_templates
set
  title = 'Payment received',
  body = 'The sender has paid for this carry request. Please arrange handover with the sender and confirm handover on the request.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set
  title = 'Payment completed',
  body = 'Your payment was successful. Please arrange handover with the traveler and confirm handover on the request.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'SENDER'
  and actor_role = 'SENDER';
