import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ArrowLeft, MoveRight } from "lucide-react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  Stripe,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js";
import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";
import Spinner from "@/app/components/Spinner";
import {
  getStripePromise,
  isStripeLiveMode,
} from "@/app/shared/stripe/stripeClient";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import {
  createCarryRequestPaymentIntent,
  paymentSetupErrorMessage,
  syncCarryRequestPayment,
} from "../application/carryRequestPayment";
import { completeCarryRequestPayment } from "../application/completeCarryRequestPayment";
import { AppError } from "@/app/shared/domain/AppError";
import { ServiceFeeRow } from "./CarryRequestCostSummary";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useCarryRequests } from "@/app/hooks/queries/useCarryRequestsQueries";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { CARRY_REQUEST_STATUSES } from "../domain/CreateCarryRequest";
import SvgIcon from "@/components/ui/SvgIcon";
import { toflag } from "@/app/Mapper";

function formatParcelWeight(weightKg: number): string {
  const value = Number(weightKg);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return Number.isInteger(value) ? `${value} kg` : `${value.toFixed(1)} kg`;
}

function isNetherlandsOrigin(country: string): boolean {
  const normalized = country.trim().toLowerCase();
  return normalized === "nl" || normalized === "netherlands";
}

const EXPRESS_CHECKOUT_ELEMENT_OPTIONS: StripeExpressCheckoutElementOptions = {
  paymentMethods: {
    googlePay: "auto",
    applePay: "auto",
    link: "auto",
    amazonPay: "never",
    paypal: "never",
    klarna: "never",
  },
  paymentMethodOrder: ["google_pay", "apple_pay", "link"],
};

function ImperativeExpressCheckout({
  options,
  onConfirm,
}: {
  options: StripeExpressCheckoutElementOptions;
  onConfirm: (event: StripeExpressCheckoutElementConfirmEvent) => void;
}) {
  const elements = useElements();
  const containerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef({ onConfirm });
  handlersRef.current = { onConfirm };

  useEffect(() => {
    if (!elements || !containerRef.current) return;

    const expressCheckoutElement = elements.create("expressCheckout", options);

    expressCheckoutElement.on("click", (event) => {
      event.resolve();
    });

    expressCheckoutElement.on("confirm", (event) => {
      handlersRef.current.onConfirm(event);
    });

    expressCheckoutElement.mount(containerRef.current);

    return () => {
      expressCheckoutElement.destroy();
    };
  }, [elements, options]);

  return <div id="express-checkout-element" ref={containerRef} />;
}

function PaymentCheckoutForm({
  carryRequestId,
  clientSecret,
  paymentCurrency,
  originCountry,
  onPaymentComplete,
}: {
  carryRequestId: string;
  clientSecret: string;
  paymentCurrency: string | null;
  originCountry: string;
  onPaymentComplete: () => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showIdealCheckout =
    paymentCurrency?.toLowerCase() === "eur" &&
    isNetherlandsOrigin(originCountry);

  const paymentElementOptions = useMemo(() => {
    const options: Parameters<typeof PaymentElement>[0]["options"] = {
      layout: {
        type: "accordion",
        defaultCollapsed: false,
        radios: "never",
      },
      wallets: {
        applePay: "never",
        googlePay: "never",
      },
    };

    if (showIdealCheckout) {
      options.paymentMethodOrder = ["ideal", "card"];
      options.defaultValues = {
        billingDetails: {
          address: {
            country: "NL",
          },
        },
      };
    }

    return options;
  }, [showIdealCheckout]);

  const completeSuccessfulPayment = async () => {
    const syncResult = await syncCarryRequestPayment(carryRequestId);
    if (!syncResult.ok) {
      setErrorMessage(
        syncResult.error ??
          "We couldn't confirm your payment yet. Wait a moment and try again.",
      );
      return false;
    }

    await onPaymentComplete();
    return true;
  };

  const handleExpressConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const returnUrl = `${window.location.origin}/requests/pay/${encodeURIComponent(carryRequestId)}`;
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

      if (result.error) {
        const message = result.error.message ?? "Payment could not be completed.";
        event.paymentFailed({ message });
        setErrorMessage(message);
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        const message = "Payment was not completed. Please try again.";
        event.paymentFailed({ message });
        setErrorMessage(message);
        return;
      }

      const completed = await completeSuccessfulPayment();
      if (!completed) {
        event.paymentFailed({
          message: "Payment succeeded but could not be verified. Please refresh.",
        });
      }
    } catch (err) {
      const message = AppError.fromUnknown(err).message;
      event.paymentFailed({ message });
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      const returnUrl = `${window.location.origin}/requests/pay/${encodeURIComponent(carryRequestId)}`;
      const result = await stripe.confirmPayment({
        elements,
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

      const completed = await completeSuccessfulPayment();
      if (!completed) return;
    } catch (err) {
      setErrorMessage(AppError.fromUnknown(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <CustomText textSize="sm" textVariant="secondary">
        {isStripeLiveMode()
          ? showIdealCheckout
            ? "Pay securely with Apple Pay, Google Pay, Link, iDEAL, or card."
            : "Pay securely with Stripe using card, Apple Pay, Google Pay, or Link."
          : "Pay securely with Stripe test mode. Use a test card — no real charge."}
      </CustomText>

      {clientSecret ? (
        <ImperativeExpressCheckout
          options={EXPRESS_CHECKOUT_ELEMENT_OPTIONS}
          onConfirm={handleExpressConfirm}
        />
      ) : null}

      {showIdealCheckout ? (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <CustomText textSize="xs" textVariant="secondary">
            Or pay with iDEAL or card
          </CustomText>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      ) : null}

      <div id="payment-element" className="w-full">
        <PaymentElement className="w-full" options={paymentElementOptions} />
      </div>

      {errorMessage ? (
        <CustomText textSize="sm" textVariant="error">
          {errorMessage}
        </CustomText>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="md"
        disabled={!stripe || !elements || isSubmitting}
        isBusy={isSubmitting}
        onClick={() => void handlePay()}
        className="w-full"
      >
        {isSubmitting ? "Processing..." : "Pay now"}
      </Button>
    </div>
  );
}

export default function PayCarryRequestPage() {
  const { carryRequestId = "" } = useParams<{ carryRequestId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const { openInfo, showSupabaseError } = useUniversalModal();
  const paymentReturnHandledRef = useRef<string | null>(null);

  const { data: carryRequestsData, isPending: requestsPending } = useCarryRequests(
    user?.id,
  );

  const carryRequest = useMemo(
    () =>
      carryRequestsData?.find((request) => request.carryRequestId === carryRequestId),
    [carryRequestsData, carryRequestId],
  );

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string | null>(null);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number | null>(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);

  const originCountry = carryRequest?.parcelSnapshot.origin.country ?? "UK";

  const handlePaymentComplete = useCallback(async () => {
    setIsCompletingPayment(true);
    try {
      const result = await completeCarryRequestPayment(carryRequestId, {
        queryClient,
        refreshProfile,
      });

      if (result.status === "success" || result.status === "already_paid") {
        openInfo({
          title: "Payment success",
          message:
            "Payment received. The traveler's contact details have been shared via email and in-app notifications. Arrange the package handover and confirm when it is done.",
          label: "Close",
          onClick: () => navigate("/requests"),
        });
        navigate("/requests");
        return;
      }

      if (result.status === "expired") {
        openInfo({
          title: "Request expired",
          message: "This request has expired. You can send a new one.",
          label: "Browse trips",
          onClick: () => navigate("/travelers"),
        });
        navigate("/requests?tab=expired");
        return;
      }

      openInfo({
        title: "Payment not confirmed",
        message: "Stripe payment is still processing. Wait a moment and try again.",
        label: "Close",
      });
    } finally {
      setIsCompletingPayment(false);
    }
  }, [carryRequestId, navigate, openInfo, queryClient, refreshProfile]);

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
    if (!carryRequestId || !carryRequest) return;
    if (carryRequest.senderUserId !== user?.id) return;
    if (carryRequest.status !== CARRY_REQUEST_STATUSES.PENDING_PAYMENT) return;

    let cancelled = false;

    void (async () => {
      try {
        const result = await createCarryRequestPaymentIntent(carryRequestId);
        if (!cancelled) {
          setClientSecret(result.client_secret);
          setPaymentAmount(result.payment_amount);
          setPaymentCurrency(result.payment_currency);
          setPlatformFeeAmount(result.platform_fee_amount);
        }
      } catch (err) {
        if (!cancelled) {
          setClientSecret(null);
          setLoadError(paymentSetupErrorMessage(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carryRequest, carryRequestId, user?.id]);

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent")?.trim();
    const redirectStatus = searchParams.get("redirect_status")?.trim();

    if (!paymentIntentId || !redirectStatus) return;

    const returnKey = `${carryRequestId}:${paymentIntentId}:${redirectStatus}`;
    if (paymentReturnHandledRef.current === returnKey) return;
    paymentReturnHandledRef.current = returnKey;

    void (async () => {
      try {
        if (redirectStatus === "succeeded") {
          const syncResult = await syncCarryRequestPayment(carryRequestId);
          if (syncResult.ok) {
            await handlePaymentComplete();
          } else {
            setLoadError(
              syncResult.error ??
                "Payment succeeded but could not be verified. Refresh and try again.",
            );
          }
        } else {
          setLoadError("Payment was not completed. You can try again when ready.");
        }
      } catch (err) {
        showSupabaseError(err);
      } finally {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("payment_intent");
        params.delete("payment_intent_client_secret");
        params.delete("redirect_status");
        const nextSearch = params.toString();
        navigate(
          { pathname: `/requests/pay/${carryRequestId}`, search: nextSearch ? `?${nextSearch}` : "" },
          { replace: true },
        );
      }
    })();
  }, [carryRequestId, handlePaymentComplete, navigate, searchParams, showSupabaseError]);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!carryRequestId) {
    return <Navigate to="/requests" replace />;
  }

  if (requestsPending) {
    return (
      <DefaultContainer>
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      </DefaultContainer>
    );
  }

  if (!carryRequest) {
    return (
      <DefaultContainer>
        <Card enableHover={false} className="mx-auto max-w-2xl p-6">
          <CustomText textSize="lg" textVariant="primary" className="font-medium">
            Request not found
          </CustomText>
          <CustomText textSize="sm" textVariant="secondary" className="mt-2">
            This carry request could not be loaded.
          </CustomText>
          <Button
            variant="primary"
            size="md"
            className="mt-6 w-full sm:w-auto"
            onClick={() => navigate("/requests")}
          >
            Back to requests
          </Button>
        </Card>
      </DefaultContainer>
    );
  }

  if (carryRequest.senderUserId !== user.id) {
    return <Navigate to="/requests" replace />;
  }

  if (carryRequest.status !== CARRY_REQUEST_STATUSES.PENDING_PAYMENT) {
    return <Navigate to="/requests" replace />;
  }

  const parcel = carryRequest.parcelSnapshot;
  const originFlag = toflag(parcel.origin.country);
  const destinationFlag = toflag(parcel.destination.country);

  return (
    <DefaultContainer className="max-w-none">
      <div className="mx-auto flex w-full max-w-container flex-col gap-6 py-4 sm:py-6 lg:gap-8">
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Link>

        <div className="flex flex-col gap-2">
          <CustomText textSize="xl" textVariant="primary" className="font-medium">
            Make payment
          </CustomText>
          <CustomText textSize="sm" textVariant="secondary">
            Complete payment for carry request ID {carryRequest.carryRequestId.slice(-6)}.
          </CustomText>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-8">
          <div className="flex flex-col gap-6">
            <Card enableHover={false} sizeClass="max-w-none" className="w-full p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <span className="inline-flex w-fit items-center rounded-full border border-neutral-100 bg-neutral-100 px-3 py-1">
                  <CustomText textSize="xs" textVariant="primary" className="font-medium">
                    Parcel
                  </CustomText>
                </span>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {originFlag ? <SvgIcon size="xs" Icon={originFlag} /> : null}
                    <CustomText textSize="sm" className="font-medium">
                      {parcel.origin.country}
                    </CustomText>
                    <MoveRight
                      className="h-4 w-4 shrink-0 text-neutral-400"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {destinationFlag ? (
                      <SvgIcon size="xs" Icon={destinationFlag} />
                    ) : null}
                    <CustomText textSize="sm" className="font-medium">
                      {parcel.destination.country}
                    </CustomText>
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-2">
                  <CustomText textSize="sm" textVariant="secondary">
                    Weight
                  </CustomText>
                  <CustomText textSize="sm" textVariant="primary" className="text-right tabular-nums">
                    {formatParcelWeight(parcel.weight_kg)}
                  </CustomText>

                  {paymentAmount !== null && platformFeeAmount !== null ? (
                    <>
                      <ServiceFeeRow
                        priceCountry={originCountry}
                        serviceFee={platformFeeAmount / 100}
                      />
                      <CustomText textSize="md" textVariant="primary" className="font-medium">
                        Total charged
                      </CustomText>
                      <CustomText
                        textSize="md"
                        textVariant="primary"
                        className="text-right font-semibold tabular-nums"
                      >
                        {formatCurrencyByCountry(originCountry, paymentAmount / 100)}
                      </CustomText>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-canvas p-5 shadow-sm sm:p-8 lg:p-10">
          {loadError ? (
            <div className="flex flex-col gap-4">
              <CustomText textSize="sm" textVariant="error">
                {loadError}
              </CustomText>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => navigate("/requests")}
              >
                Back to requests
              </Button>
            </div>
          ) : null}

          {!loadError && (!clientSecret || !stripeInstance || isCompletingPayment) ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3">
              <Spinner />
              <CustomText textSize="sm" textVariant="secondary">
                {isCompletingPayment
                  ? "Confirming your payment…"
                  : "Preparing secure checkout…"}
              </CustomText>
            </div>
          ) : null}

          {clientSecret && stripeInstance && !loadError && !isCompletingPayment ? (
            <Elements
              key={clientSecret}
              stripe={stripeInstance}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    spacingUnit: "4px",
                  },
                },
              }}
            >
              <PaymentCheckoutForm
                carryRequestId={carryRequestId}
                clientSecret={clientSecret}
                paymentCurrency={paymentCurrency}
                originCountry={originCountry}
                onPaymentComplete={handlePaymentComplete}
              />
            </Elements>
          ) : null}
          </div>
        </div>
      </div>
    </DefaultContainer>
  );
}
