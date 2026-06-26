import { useEffect, useState } from "react";
import {
  formatPaymentTimeRemaining,
  type PaymentTimeRemainingViewer,
} from "../domain/carryRequestPaymentWindow";

type PaymentTimeRemainingFields = {
  paymentExpiresAt: string | null;
  stripePaymentIntentId?: string | null;
  paymentStatus?: string | null;
};

export function usePaymentTimeRemaining(
  fields: PaymentTimeRemainingFields,
  enabled: boolean,
  viewer: PaymentTimeRemainingViewer = "sender",
): string | null {
  const [remainingLabel, setRemainingLabel] = useState<string | null>(() =>
    enabled ? formatPaymentTimeRemaining(fields, Date.now(), viewer) : null,
  );

  useEffect(() => {
    if (!enabled || !fields.paymentExpiresAt) {
      setRemainingLabel(null);
      return;
    }

    const update = () => {
      setRemainingLabel(formatPaymentTimeRemaining(fields, Date.now(), viewer));
    };

    update();
    const intervalId = window.setInterval(update, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    enabled,
    fields.paymentExpiresAt,
    fields.stripePaymentIntentId,
    fields.paymentStatus,
    viewer,
  ]);

  return remainingLabel;
}
