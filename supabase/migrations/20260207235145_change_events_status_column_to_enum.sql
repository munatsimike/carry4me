ALTER TABLE carry_request_events
DROP CONSTRAINT IF EXISTS carry_request_events_type_check;


ALTER TABLE carry_request_events
ADD CONSTRAINT carry_request_events_type_check
CHECK (
    type IN (
        'REQUEST_SENT',
        'REQUEST_ACCEPTED',
        'REQUEST_REJECTED',
        'REQUEST_CANCELED',
        'PAYMENT_COMPLETED',
        'PARCEL_RECEIVED',
        'PARCEL_DELIVERED',
        'PAYMENT_RELEASED'
    )
);
