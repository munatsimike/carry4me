-- Payout-released traveler email: bank timing is 1 to 3 working days.

update public.carry_request_notification_templates
set body = 'Your payout has been released successfully. Depending on your bank, it may take 1 to 3 working days to arrive in your account.'
where type = 'PAYMENT_RELEASED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'TRAVELER';
