import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Card } from "@/app/components/card/Card";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { verifyEmail } from "@/app/shared/supabase/verifyEmail";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { getDefaultAuthedPath } from "@/app/shared/Authentication/domain/accountStatus";
import { getAuthenticatedLandingPath } from "@/app/shared/Authentication/application/postAuthNavigation";
import {
  normalizeEmailVerificationError,
} from "@/app/shared/Authentication/application/normalizeSupabaseError";
import {
  isEstablishedAppTab,
  markTabInitialized,
  requestEmailVerificationHandoff,
} from "@/app/shared/Authentication/application/emailVerificationTabCoordination";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_DELAY_MS = 2200;

type VerifyUiStatus = "loading" | "success" | "error";
type HandoffStatus = "pending" | "self" | "delegated";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);

  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>("pending");
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
    markTabInitialized();
  }, []);

  useEffect(() => {
    if (!token.trim()) {
      setHandoffStatus("self");
      return;
    }

    if (isEstablishedAppTab()) {
      setHandoffStatus("self");
      return;
    }

    let cancelled = false;

    void requestEmailVerificationHandoff(token).then((result) => {
      if (cancelled) return;
      setHandoffStatus(result === "other-tab" ? "delegated" : "self");
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (handoffStatus === "delegated") {
      window.setTimeout(() => {
        window.close();
      }, 400);
    }
  }, [handoffStatus]);

  useEffect(() => {
    if (handoffStatus !== "self") return;
    if (loading) return;

    if (user) {
      const destination = getAuthenticatedLandingPath(profile);
      if (!token.trim() || profile?.emailVerified) {
        navigate(destination, { replace: true });
        return;
      }
    }

    if (!token.trim()) {
      applyError("token_required");
      return;
    }

    if (profile?.emailVerified) {
      applySuccess(true);
      return;
    }

    let cancelled = false;

    (async () => {
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
    handoffStatus,
    loading,
    navigate,
    profile,
    profile?.emailVerified,
    refreshProfile,
    token,
    user,
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
    if (status !== "success") return;

    const timeoutId = window.setTimeout(() => {
      navigate(getDefaultAuthedPath(profile), { replace: true });
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, profile, status]);

  if (handoffStatus === "pending") {
    return (
      <DefaultContainer center outerClassName="bg-canvas min-h-screen">
        <Card enableHover={false} sizeClass="max-w-lg" className="w-full">
          <motion.div className="flex flex-col items-center gap-4 p-6 text-center">
            <Spinner />
            <CustomText textVariant="primary" textSize="lg" className="font-medium">
              Opening verification
            </CustomText>
            <CustomText textVariant="secondary" textSize="sm">
              Checking for an open Carry4Me tab…
            </CustomText>
          </motion.div>
        </Card>
      </DefaultContainer>
    );
  }

  if (handoffStatus === "delegated") {
    return (
      <DefaultContainer center outerClassName="bg-canvas min-h-screen">
        <Card enableHover={false} sizeClass="max-w-lg" className="w-full">
          <motion.div className="flex flex-col items-center gap-4 p-6 text-center">
            <CustomText textVariant="primary" textSize="lg" className="font-medium">
              Continuing in your open tab
            </CustomText>
            <CustomText textVariant="secondary" textSize="sm">
              Email verification is running in your existing Carry4Me tab. You
              can close this one.
            </CustomText>
          </motion.div>
        </Card>
      </DefaultContainer>
    );
  }

  return (
    <DefaultContainer center outerClassName="bg-canvas min-h-screen">
      <Card enableHover={false} sizeClass="max-w-lg" className="w-full">
        <motion.div
          className="flex flex-col items-center gap-4 p-6 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status === "loading" && <Spinner />}
          <CustomText textVariant="primary" textSize="lg" className="font-medium">
            {title}
          </CustomText>
          <CustomText textVariant="secondary" textSize="sm">
            {message}
          </CustomText>
        </motion.div>
      </Card>
    </DefaultContainer>
  );
}
