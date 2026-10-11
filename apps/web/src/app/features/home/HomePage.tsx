import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits, questions } from "../../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";
import FaqSection from "./sections/faqSection/FaqSection";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/Toast";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import CustomModal from "@/app/components/CustomModal";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import {
  isSuspended,
} from "@/app/shared/Authentication/domain/accountStatus";
import { getAuthenticatedLandingPath } from "@/app/shared/Authentication/application/postAuthNavigation";
import {
  DELETE_STRIPE_CONFIRM_PHRASE,
  deleteStripeAccount,
} from "@/app/shared/stripe/application/deleteStripeAccount";
import { AppError } from "@/app/shared/domain/AppError";
import { isAdminProfile } from "@/app/shared/Authentication/domain/profileType";

/** Temp Stripe delete panel on home. Set false before production deploys. */
const TEMP_DELETE_STRIPE_ENABLED = false;
const TEMP_DELETE_STRIPE_PARAM = "deleteStripe";

export default function HomePage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSignup = searchParams.get("signup") === "success";
  const location = useLocation();
  const { user, loading, profile } = useAuth();
  const showTempDeleteStripe =
    isAdminProfile(profile) &&
    (TEMP_DELETE_STRIPE_ENABLED ||
      searchParams.get(TEMP_DELETE_STRIPE_PARAM) === "1");
  const shouldSendAuthedUserToApp =
    !!user &&
    !!profile &&
    !loading &&
    !showTempDeleteStripe &&
    !isSuspended(profile);

  useEffect(() => {
    if (location.hash !== "#how-it-works") return;
    const target = document.getElementById("how-it-works");
    if (!target) return;
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  useEffect(() => {
    const raw = sessionStorage.getItem("redirectToast");
    if (!raw) return;
    const data = JSON.parse(raw) as {
      message: string;
      variant: "success" | "info" | "warning" | "error";
    };

    const timer = setTimeout(() => {
      toast(data.message, { variant: data.variant });
      sessionStorage.removeItem("redirectToast");
    }, 700); // 300–800ms feels natural

    return () => clearTimeout(timer);
  }, [toast]);

  const handleClose = (param: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete(param); // THIS is what matters
    setSearchParams(next);
  };

  if (shouldSendAuthedUserToApp) {
    return <Navigate to={getAuthenticatedLandingPath(profile)} replace />;
  }

  return (
    <>
      {showTempDeleteStripe ? (
        <TempDeleteStripePanel
          loading={loading}
          defaultAccountId={profile?.stripeAccountId ?? ""}
        />
      ) : null}
      <HeroSection />
      <HowItWorks steps={steps} />
      <TrustAndSafety items={safetyRules} />
      <Benefits items={benefits} />
      <FaqSection items={questions} />
      <AnimatePresence>
        {isSignup && <Modal onClose={() => handleClose("signup")} />}
      </AnimatePresence>
    </>
  );
}

type TempDeleteStripePanelProps = {
  loading: boolean;
  defaultAccountId: string;
};

function TempDeleteStripePanel({
  loading,
  defaultAccountId,
}: TempDeleteStripePanelProps) {
  const { toast } = useToast();
  const [stripeAccountId, setStripeAccountId] = useState(defaultAccountId);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultAccountId) return;
    setStripeAccountId((current) => current || defaultAccountId);
  }, [defaultAccountId]);

  const handleDelete = async () => {
    const accountId = stripeAccountId.trim();

    if (!accountId.startsWith("acct_")) {
      toast("Enter a valid Stripe account id (acct_...)", { variant: "error" });
      return;
    }

    if (confirmPhrase.trim() !== DELETE_STRIPE_CONFIRM_PHRASE) {
      toast(`Type ${DELETE_STRIPE_CONFIRM_PHRASE} to confirm.`, {
        variant: "error",
      });
      return;
    }

    setDeleting(true);
    setLastResult(null);

    try {
      const result = await deleteStripeAccount(accountId, {
        confirm: true,
        confirmPhrase: DELETE_STRIPE_CONFIRM_PHRASE,
      });
      const message = JSON.stringify(result, null, 2);
      setLastResult(message);
      toast(result.deleted ? "Stripe account deleted" : "Profile cleared", {
        variant: "success",
      });
    } catch (err) {
      const message = AppError.fromUnknown(err).message;
      setLastResult(message);
      toast(message, { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="border-b border-amber-300 bg-amber-50 px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <CustomText as="p" textSize="sm" className="font-medium text-amber-900">
          Temp: delete Stripe Connect account
        </CustomText>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={stripeAccountId}
            onChange={(event) => setStripeAccountId(event.target.value)}
            placeholder="acct_..."
            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={confirmPhrase}
            onChange={(event) => setConfirmPhrase(event.target.value)}
            placeholder={DELETE_STRIPE_CONFIRM_PHRASE}
            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={deleting || loading}
            onClick={() => void handleDelete()}
          >
            {deleting ? "Deleting..." : "Delete Stripe account"}
          </Button>
        </div>

        {lastResult ? (
          <pre className="overflow-x-auto rounded-md bg-white p-3 text-xs text-gray-800">
            {lastResult}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

type ModalProps = {
  onClose: () => void;
};

function Modal({ onClose }: ModalProps) {
  return (
    <CustomModal onClose={onClose} width="lg">
      <div className="flex flex-col gap-3 p-4">
        <CustomText
          as="h2"
          textSize="lg"
          className="font-medium"
          textVariant="primary"
        >
          Account created successfully
        </CustomText>

        <CustomText as="p" className="mb-3" textVariant="secondary">
          Activate your account by clicking the link in the email we sent you
          and start using Carry4Me.
        </CustomText>

        <div className="flex justify-end gap-4">
          <Button
            onClick={onClose}
            variant="primary"
            size="sm"
          >
            Close
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
