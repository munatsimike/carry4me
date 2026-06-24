import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import CustomModal from "@/app/components/CustomModal";
import { ModalBody, ModalFooter } from "@/app/components/ModalFooter";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { getStripePromise, isStripeLiveMode } from "@/app/shared/stripe/stripeClient";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import {
  createCarryRequestPaymentIntent,
  syncCarryRequestPayment,
} from "../application/carryRequestPayment";
import { AppError } from "@/app/shared/domain/AppError";
import { ServiceFeeRow } from "./CarryRequestCostSummary";

type PayCarryRequestModalProps = {
  carryRequestId: string;
  originCountry: string;
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

      const returnUrl = `${window.location.origin}/requests?carry_request_id=${encodeURIComponent(carryRequestId)}`;
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
            "We couldn't confirm your payment yet. Wait a moment and try again.",
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
    <div className="flex flex-col">
      <ModalBody className="gap-4">
        <CustomText textSize="sm" textVariant="secondary">
          {isStripeLiveMode()
            ? "Pay securely with Stripe. Your card will be charged when you confirm payment."
            : "Pay securely with Stripe test mode. Use a test card — no real charge."}
        </CustomText>
        <PaymentElement
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false,
            },
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
            paymentMethodOrder: ["apple_pay", "google_pay", "card"],
          }}
        />
        {errorMessage ? (
          <CustomText textSize="sm" className="text-red-600">
            {errorMessage}
          </CustomText>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Not now
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!stripe || !elements || isSubmitting}
          isBusy={isSubmitting}
          onClick={() => void handlePay()}
        >
          {isSubmitting ? "Processing..." : "Pay now"}
        </Button>
      </ModalFooter>
    </div>
  );
}

export default function PayCarryRequestModal(props: PayCarryRequestModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getStripePromise()
      .then((stripe) => {
        if (!cancelled) {
          if (!stripe) {
            setLoadError("Stripe failed to load. Check your payment configuration.");
            return;
          }
          setStripeInstance(stripe);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(AppError.fromUnknown(err).message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await createCarryRequestPaymentIntent(props.carryRequestId);
        if (!cancelled) {
          setClientSecret(result.client_secret);
          setPaymentAmount(result.payment_amount);
          setPlatformFeeAmount(result.platform_fee_amount);
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
    <CustomModal
      width="3xl"
      scrollable
      closeOnBackdropClick={false}
      onClose={props.onClose}
    >
      <div className="flex flex-col gap-4">
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
        {paymentAmount !== null && platformFeeAmount !== null ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1 overflow-visible">
              <ServiceFeeRow
                priceCountry={props.originCountry}
                serviceFee={platformFeeAmount / 100}
              />

              <CustomText textSize="sm" textVariant="primary" className="font-medium">
                Total charged
              </CustomText>
              <CustomText textSize="sm" textVariant="primary" className="text-right font-medium">
                {formatCurrencyByCountry(props.originCountry, paymentAmount / 100)}
              </CustomText>
            </div>
          </div>
        ) : null}
        {clientSecret && stripeInstance ? (
          <Elements
            key={clientSecret}
            stripe={stripeInstance}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentForm {...props} clientSecret={clientSecret} />
          </Elements>
        ) : null}
      </div>
    </CustomModal>
  );
}
