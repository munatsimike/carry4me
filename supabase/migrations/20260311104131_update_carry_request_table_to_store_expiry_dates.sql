BEGIN;

-- 1) Add columns
ALTER TABLE public.carry_requests
ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS expired_at timestamptz NULL;

-- 2) Recreate status check constraint with uppercase values + EXPIRED
ALTER TABLE public.carry_requests
DROP CONSTRAINT IF EXISTS carry_requests_status_check;

ALTER TABLE public.carry_requests
ADD CONSTRAINT carry_requests_status_check
CHECK (
  status IN (
    'PENDING_ACCEPTANCE',
    'REJECTED',
    'CANCELLED',
    'PENDING_PAYMENT',
    'EXPIRED',
    'PENDING_HANDOVER',
    'IN_TRANSIT',
    'PENDING_PAYOUT',
    'PAID_OUT'
  )
);

-- 3) Optional helpful index for expiry lookup
CREATE INDEX IF NOT EXISTS idx_carry_requests_pending_payment_expires_at
ON public.carry_requests (payment_expires_at)
WHERE status = 'PENDING_PAYMENT';

COMMIT;