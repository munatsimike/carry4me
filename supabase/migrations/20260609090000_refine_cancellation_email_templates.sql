-- Refine cancellation messaging and CTA targets by actor/recipient role.

insert into public.carry_request_notification_templates (
  type,
  recipient_role,
  actor_role,
  title,
  body,
  link
)
values
  (
    'REQUEST_CANCELED',
    'TRAVELER',
    'SENDER',
    'Request cancelled',
    'The sender cancelled this request. You can browse other parcels now.',
    '/parcels'
  ),
  (
    'REQUEST_CANCELED',
    'SENDER',
    'TRAVELER',
    'Request cancelled',
    'The traveler cancelled this request. A full refund has been initiated for you. You can browse other trips now.',
    '/travelers'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

