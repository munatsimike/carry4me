-- Clearer payment-completed copy: how to arrange handover and confirm in account.

update public.carry_request_notification_templates
set
  title = 'Payment received',
  body = 'The sender has completed payment for this carry request. Please arrange the package handover with the sender and, once the handover is complete, confirm it on this request in your account.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set
  title = 'Payment completed',
  body = 'Your payment for this carry request is complete. Please arrange the package handover with the traveler and, once the handover is complete, confirm it on this request in your account.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'SENDER'
  and actor_role = 'SENDER';
