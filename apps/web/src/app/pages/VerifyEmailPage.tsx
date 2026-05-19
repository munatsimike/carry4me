import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { verifyEmail } from "@/app/shared/supabase/verifyEmail";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { getDefaultAuthedPath } from "@/app/shared/Authentication/domain/accountStatus";
import {
  normalizeEmailVerificationError,
  type NormalizedError,
} from "@/app/shared/Authentication/application/normalizeSupabaseError";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_DELAY_MS = 2200;

type VerifyUiStatus = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);

  const [status, setStatus] = useState<VerifyUiStatus>("loading");
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [title, setTitle] = useState("Verifying email");
  const [message, setMessage] = useState("Verifying your email…");
  const [errorAction, setErrorAction] = useState<NormalizedError["action"]>();

  const applySuccess = (isAlreadyVerified: boolean) => {
    const copy = normalizeEmailVerificationError(
      isAlreadyVerified ? "already_verified" : "email_verified",
    );
    setAlreadyVerified(isAlreadyVerified);
    setStatus("success");
    setTitle(copy.title);
    setMessage(copy.message);
    setErrorAction(undefined);
  };

  const applyError = (errorCode?: string) => {
    const copy = normalizeEmailVerificationError(errorCode);
    setStatus("error");
    setTitle(copy.title);
    setMessage(copy.message);
    setErrorAction(copy.action);
  };

  useEffect(() => {
    if (loading) return;

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
  }, [authRepo, loading, profile?.emailVerified, refreshProfile, token, user?.id]);

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

  const continuePath = getDefaultAuthedPath(profile);

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

          {status !== "loading" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(continuePath, { replace: true })}
            >
              <CustomText textVariant="onDark">Go to dashboard</CustomText>
            </Button>
          )}

          {status === "error" && errorAction === "signIn" && (
            <Link
              to="/signin"
              className="text-sm text-primary-500 hover:underline"
            >
              Sign in
            </Link>
          )}
        </motion.div>
      </Card>
    </DefaultContainer>
  );
}
