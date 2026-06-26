import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Card } from "@/app/components/card/Card";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { verifyEmail } from "@/app/shared/supabase/verifyEmail";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { getAuthenticatedLandingPath } from "@/app/shared/Authentication/application/postAuthNavigation";
import {
  normalizeEmailVerificationError,
} from "@/app/shared/Authentication/application/normalizeSupabaseError";
import { notifyEmailVerified } from "@/app/shared/Authentication/application/emailVerificationTabCoordination";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type VerifyUiStatus = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const verifiedBroadcastRef = useRef(false);
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);

  const [status, setStatus] = useState<VerifyUiStatus>("loading");
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [title, setTitle] = useState("Verifying email");
  const [message, setMessage] = useState("Verifying your email…");

  const applySuccess = (isAlreadyVerified: boolean) => {
    const copy = normalizeEmailVerificationError(
      isAlreadyVerified ? "already_verified" : "email_verified",
    );
    setAlreadyVerified(isAlreadyVerified);
    setStatus("success");
    setTitle(copy.title);
    setMessage(copy.message);
  };

  const applyError = (errorCode?: string) => {
    const copy = normalizeEmailVerificationError(errorCode);
    setStatus("error");
    setTitle(copy.title);
    setMessage(copy.message);
  };

  useEffect(() => {
    if (loading) return;

    if (!token.trim()) {
      if (profile?.emailVerified) {
        applySuccess(true);
      } else {
        applyError("token_required");
      }
      return;
    }

    if (profile?.emailVerified) {
      applySuccess(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await verifyEmail(token);
        if (cancelled) return;

        if (result.verified) {
          await refreshProfile();
          applySuccess(result.alreadyVerified === true);
          return;
        }

        if (result.error === "link_already_used") {
          await refreshProfile();

          if (user?.id) {
            const freshProfile = await authRepo.fetchUserProfile(user.id);
            if (freshProfile?.emailVerified) {
              applySuccess(true);
              return;
            }
          }

          applyError("link_already_used");
          return;
        }

        applyError(result.error);
      } catch {
        if (cancelled) return;
        applyError("email_verify_failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authRepo,
    loading,
    profile?.emailVerified,
    refreshProfile,
    token,
    user?.id,
  ]);

  useEffect(() => {
    if (status !== "success" || toastShownRef.current) return;

    toastShownRef.current = true;
    toast(
      alreadyVerified ? "Your email is already verified." : "Email verified.",
      { variant: "success" },
    );
  }, [alreadyVerified, status, toast]);

  useEffect(() => {
    if (status !== "success" || verifiedBroadcastRef.current) return;

    verifiedBroadcastRef.current = true;
    notifyEmailVerified();
  }, [status]);

  const handleContinue = () => {
    if (user) {
      navigate(getAuthenticatedLandingPath(profile), { replace: true });
      return;
    }

    navigate("/signin", { replace: true });
  };

  return (
    <DefaultContainer center outerClassName="bg-canvas min-h-screen">
      <Card enableHover={false} sizeClass="max-w-lg" className="w-full">
        <motion.div
          className="flex flex-col items-center gap-4 p-6 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status === "loading" && <Spinner />}

          {status === "success" && (
            <CheckCircle2
              className="h-12 w-12 text-success-600"
              strokeWidth={1.5}
              aria-hidden
            />
          )}

          {status === "error" && (
            <XCircle
              className="h-12 w-12 text-red-600"
              strokeWidth={1.5}
              aria-hidden
            />
          )}

          <CustomText textVariant="primary" textSize="lg" className="font-medium">
            {title}
          </CustomText>
          <CustomText textVariant="secondary" textSize="sm">
            {message}
          </CustomText>

          {status === "success" ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="mt-2 w-full sm:w-auto"
              onClick={handleContinue}
            >
              Continue to Carry4Me
            </Button>
          ) : null}

          {status === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              className="mt-2 w-full sm:w-auto"
              onClick={() => navigate(user ? "/profile" : "/signin", { replace: true })}
            >
              {user ? "Back to profile" : "Sign in"}
            </Button>
          ) : null}
        </motion.div>
      </Card>
    </DefaultContainer>
  );
}
