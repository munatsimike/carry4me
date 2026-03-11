INSERT INTO carry_request_notification_templates (type, recipient_role, actor_role, title, body)
VALUES
('REQUEST_EXPIRED','SENDER','TRAVELER','Payment window expired','The request has expired because payment was not made in time. You can create a new request.'),
('REQUEST_EXPIRED','TRAVELER','SENDER','Payment window expired','TThe request has expired because payment was not made in time. You can create a new request.')
ON CONFLICT (type, recipient_role, actor_role)
DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  link = '/requests';