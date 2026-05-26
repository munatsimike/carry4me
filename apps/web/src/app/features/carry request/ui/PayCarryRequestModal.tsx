import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import CustomModal from "@/app/components/CustomModal";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { getStripePromise } from "@/app/shared/stripe/stripeClient";
import {
  createCarryRequestPaymentIntent,
  syncCarryRequestPayment,
} from "../application/carryRequestPayment";
import { AppError } from "@/app/shared/domain/AppError";

type PayCarryRequestModalProps = {
  carryRequestId: string;
  onClose: () => void;
  onPaymentComplete: () => Promise<void>;
};

function PaymentForm({
  carryRequestId,
  clientSecret,
  onClose,
  onPaymentComplete,
}: PayCarryRequestModalProps & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message ?? "Check your payment details.");
        return;
      }

      const returnUrl = `${window.location.origin}/requests`;
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Payment could not be completed.");
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        setErrorMessage("Payment was not completed. Please try again.");
        return;
      }

      const syncResult = await syncCarryRequestPayment(carryRequestId);
      if (!syncResult.ok) {
        setErrorMessage(
          syncResult.error ??
            "Payment is processing. Please wait a moment and try again.",
        );
        return;
      }
      await onPaymentComplete();
      onClose();
    } catch (err) {
      const message = AppError.fromUnknown(err).message;
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <CustomText textSize="sm" textVariant="secondary">
        Pay securely with Stripe test mode. Your card will not be charged in production
        until go-live.
      </CustomText>
      <PaymentElement />
      {errorMessage ? (
        <CustomText textSize="sm" className="text-red-600">
          {errorMessage}
        </CustomText>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!stripe || !elements || isSubmitting}
          isBusy={isSubmitting}
          onClick={() => void handlePay()}
        >
          Pay now
        </Button>
      </div>
    </div>
  );
}

export default function PayCarryRequestModal(props: PayCarryRequestModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await createCarryRequestPaymentIntent(props.carryRequestId);
        if (!cancelled) {
          setClientSecret(result.client_secret);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(AppError.fromUnknown(err).message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.carryRequestId]);

  return (
    <CustomModal width="lg" scrollable onClose={props.onClose}>
      <div className="flex flex-col gap-3">
        <CustomText textSize="lg" textVariant="primary" className="font-medium">
          Make payment
        </CustomText>
        {loadError ? (
          <CustomText textSize="sm" className="text-red-600">
            {loadError}
          </CustomText>
        ) : null}
        {!loadError && !clientSecret ? (
          <CustomText textSize="sm" textVariant="secondary">
            Preparing secure payment…
          </CustomText>
        ) : null}
        {clientSecret ? (
          <Elements
            stripe={getStripePromise()}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <PaymentForm {...props} clientSecret={clientSecret} />
          </Elements>
        ) : null}
      </div>
    </CustomModal>
  );
}
