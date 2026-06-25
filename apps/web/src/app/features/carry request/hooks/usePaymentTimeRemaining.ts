import { useEffect, useState } from "react";
import { formatPaymentTimeRemaining } from "../domain/carryRequestPaymentWindow";

type PaymentTimeRemainingFields = {
  paymentExpiresAt: string | null;
  stripePaymentIntentId?: string | null;
  paymentStatus?: string | null;
};

export function usePaymentTimeRemaining(
  fields: PaymentTimeRemainingFields,
  enabled: boolean,
): string | null {
  const [remainingLabel, setRemainingLabel] = useState<string | null>(() =>
    enabled ? formatPaymentTimeRemaining(fields) : null,
  );

  useEffect(() => {
    if (!enabled || !fields.paymentExpiresAt) {
      setRemainingLabel(null);
      return;
    }

    const update = () => {
      setRemainingLabel(formatPaymentTimeRemaining(fields));
    };

    update();
    const intervalId = window.setInterval(update, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    enabled,
    fields.paymentExpiresAt,
    fields.stripePaymentIntentId,
    fields.paymentStatus,
  ]);

  return remainingLabel;
}
