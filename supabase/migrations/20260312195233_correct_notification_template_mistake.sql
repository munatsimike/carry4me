UPDATE carry_request_notification_templates
SET body = 'The request has expired because payment was not made in time. You can create a new request.'
WHERE type = 'REQUEST_EXPIRED'
  AND recipient_role = 'TRAVELER'
  AND actor_role = 'SENDER';