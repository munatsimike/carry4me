-- Rejected-request emails: notify the initiator with browse CTA by recipient role.

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
    'REQUEST_REJECTED',
    'SENDER',
    'TRAVELER',
    'Request rejected',
    'The traveler declined your carry request. You can browse other trips now.',
    '/travelers'
  ),
  (
    'REQUEST_REJECTED',
    'TRAVELER',
    'SENDER',
    'Request rejected',
    'The sender declined your offer to carry their parcel. You can browse other parcels now.',
    '/parcels'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

-- Align cancellation email CTA labels in copy (links already set in 20260609090000).

update public.carry_request_notification_templates
set body = 'The sender cancelled this request. You can browse other parcels now.'
where type = 'REQUEST_CANCELED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set body = 'The traveler cancelled this request. A full refund has been initiated for you. You can browse other trips now.'
where type = 'REQUEST_CANCELED'
  and recipient_role = 'SENDER'
  and actor_role = 'TRAVELER';
