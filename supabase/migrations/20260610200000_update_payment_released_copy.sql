update public.carry_request_notification_templates
set body = 'Payment has been released to the traveler. Thank you for using Carry4Me.'
where type = 'PAYMENT_RELEASED';
