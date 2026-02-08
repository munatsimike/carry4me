ALTER TABLE carry_requests
DROP CONSTRAINT IF EXISTS carry_requests_status_check;

ALTER TABLE carry_requests
ADD CONSTRAINT carry_requests_status_check
CHECK (
    status IN (
        'PENDING_ACCEPTANCE',
        'REJECTED',
        'CANCELLED',
        'PENDING_PAYMENT',
        'PENDING_HANDOVER',
        'IN_TRANSIT',
        'PENDING_PAYOUT',
        'PAID_OUT'
    )
);
