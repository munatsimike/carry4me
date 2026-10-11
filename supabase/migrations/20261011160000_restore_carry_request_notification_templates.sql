-- Restore carry_request_notification_templates after accidental row deletion.
-- Copy is the final state from prior template migrations (idempotent upsert).

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
    'REQUEST_SENT',
    'TRAVELER',
    'SENDER',
    'New carry request',
    'A sender would like you to carry their parcel on your upcoming trip.',
    '/requests'
  ),
  (
    'REQUEST_SENT',
    'SENDER',
    'TRAVELER',
    'New carry request',
    'A traveler offered to carry your parcel on their trip.',
    '/requests'
  ),
  (
    'REQUEST_ACCEPTED',
    'TRAVELER',
    'SENDER',
    'Request accepted',
    'The sender accepted your request to carry their parcel on your trip.',
    '/requests'
  ),
  (
    'REQUEST_ACCEPTED',
    'SENDER',
    'TRAVELER',
    'Request accepted',
    'The traveler accepted your request to carry your parcel. Make payment to continue. Your payment will be held securely until delivery is complete.',
    '/requests'
  ),
  (
    'REQUEST_REJECTED',
    'TRAVELER',
    'SENDER',
    'Request rejected',
    'The sender declined your offer to carry their parcel. You can browse other parcels now.',
    '/parcels'
  ),
  (
    'REQUEST_REJECTED',
    'SENDER',
    'TRAVELER',
    'Request rejected',
    'The traveler declined your carry request. You can browse other trips now.',
    '/travelers'
  ),
  (
    'REQUEST_CANCELED',
    'TRAVELER',
    'SENDER',
    'Request cancelled',
    'The sender cancelled this request. You can browse other parcels.',
    '/parcels'
  ),
  (
    'REQUEST_CANCELED',
    'SENDER',
    'TRAVELER',
    'Request cancelled',
    'The traveler cancelled this request. A full refund has been initiated for you. You can browse other trips now.',
    '/travelers'
  ),
  (
    'REQUEST_EXPIRED',
    'SENDER',
    'TRAVELER',
    'Payment window expired',
    'The request has expired because payment was not made in time. You can create a new request.',
    '/requests'
  ),
  (
    'REQUEST_EXPIRED',
    'TRAVELER',
    'SENDER',
    'Payment window expired',
    'The request has expired because payment was not made in time. You can create a new request.',
    '/requests'
  ),
  (
    'PAYMENT_COMPLETED',
    'TRAVELER',
    'SENDER',
    'Payment received',
    'The sender has paid. Please arrange the package handover and confirm it once completed.',
    '/requests'
  ),
  (
    'PAYMENT_COMPLETED',
    'SENDER',
    'SENDER',
    'Payment completed',
    'Payment has been completed. Please arrange the package handover with the traveler and confirm the handover.',
    '/requests'
  ),
  (
    'HANDOVER_CONFIRMED',
    'TRAVELER',
    'SENDER',
    'Sender confirmed handover',
    'The sender has confirmed handover. Please confirm when you have received the parcel.',
    '/requests'
  ),
  (
    'HANDOVER_CONFIRMED',
    'SENDER',
    'TRAVELER',
    'Traveler confirmed handover',
    'The traveler has confirmed handover. Please confirm when you have handed over the parcel.',
    '/requests'
  ),
  (
    'PARCEL_RECEIVED',
    'TRAVELER',
    'SENDER',
    'Handover confirmed',
    'Both parties confirmed handover. The parcel is now in transit.',
    '/requests'
  ),
  (
    'PARCEL_RECEIVED',
    'SENDER',
    'TRAVELER',
    'Handover confirmed',
    'Both parties confirmed handover. The parcel is now in transit.',
    '/requests'
  ),
  (
    'PARCEL_DELIVERED',
    'TRAVELER',
    'SENDER',
    'Parcel delivered',
    'The parcel was marked as delivered.',
    '/requests'
  ),
  (
    'PARCEL_DELIVERED',
    'SENDER',
    'TRAVELER',
    'Parcel delivered',
    'The parcel was marked as delivered.',
    '/requests'
  ),
  (
    'PAYMENT_RELEASED',
    'SENDER',
    'TRAVELER',
    'Payment released',
    'Payment has been released to the traveler. Thank you for using Carry4Me.',
    '/requests'
  ),
  (
    'PAYMENT_RELEASED',
    'TRAVELER',
    'TRAVELER',
    'Payout released',
    'Your payout has been released successfully. Depending on your bank, it may take 1 to 3 working days to arrive in your account.',
    '/requests'
  ),
  (
    'PAYMENT_RELEASED',
    'TRAVELER',
    'SENDER',
    'Payment released',
    'Payment has been released to the traveler. Thank you for using Carry4Me.',
    '/requests'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;
