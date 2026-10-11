export const DELETE_STRIPE_ACTION = "DELETE_STRIPE_CONNECT";
export const DELETE_STRIPE_CONFIRM_PHRASE = "DELETE CONNECT ACCOUNT";
export const RECOVER_LOCK_CONFIRM_PHRASE = "RELEASE DELETE LOCK";
export const STARTED_LOCK_TTL_MS = 15 * 60 * 1000;
export const STRIPE_LIST_PAGE_SIZE = 100;
export const STRIPE_LIST_MAX_PAGES = 20;

export const ACTIVE_CARRY_REQUEST_STATUSES = [
  "PENDING_ACCEPTANCE",
  "PENDING_PAYMENT",
  "PENDING_HANDOVER",
  "IN_TRANSIT",
  "PENDING_PAYOUT",
] as const;

export const TERMINAL_UNPAID_STATUSES = [
  "CANCELLED",
  "EXPIRED",
  "REJECTED",
] as const;

export const REFUNDED_PAYMENT_STATUSES = [
  "REFUNDED_FULL",
  "REFUNDED_PARTIAL",
] as const;

export const CLOSED_DISPUTE_STATUSES = [
  "won",
  "lost",
  "warning_closed",
  "charge_refunded",
] as const;
