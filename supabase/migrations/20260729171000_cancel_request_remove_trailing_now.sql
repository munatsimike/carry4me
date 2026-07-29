-- Remove trailing "now" from sender-cancelled cancellation copy to travelers.
update public.carry_request_notification_templates
set body = 'The sender cancelled this request. You can browse other parcels.'
where body = 'The sender cancelled this request. You can browse other parcels now.';
