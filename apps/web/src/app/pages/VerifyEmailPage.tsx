import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";
import Spinner from "@/app/components/Spinner";
import { verifyEmail } from "@/app/shared/supabase/verifyEmail";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { getDefaultAuthedPath } from "@/app/shared/Authentication/domain/accountStatus";
import { AppError } from "@/app/shared/domain/AppError";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_DELAY_MS = 2500;

function toFriendlyVerificationError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("not found")
  ) {
    return "This verification link is invalid or has expired. Request a new verification email from your dashboard or profile.";
  }

  return message;
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token.trim()) {
      setStatus("error");
      setMessage(
        "This verification link is invalid or has expired. Request a new verification email from your dashboard or profile.",
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await verifyEmail(token);
        if (cancelled) return;

        if (result.verified) {
          await refreshProfile();
          setStatus("success");
          setMessage("Your email has been verified. Redirecting you now…");
          return;
        }

        setStatus("error");
        setMessage(
          "We could not verify your email. The link may be invalid or expired.",
        );
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(toFriendlyVerificationError(AppError.fromUnknown(error).message));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshProfile, token]);

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
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          {status === "loading" && <Spinner />}
          <CustomText textVariant="primary" textSize="lg" className="font-medium">
            {status === "success"
              ? "Email verified"
              : status === "error"
                ? "Verification failed"
                : "Verifying email"}
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
              <CustomText textVariant="onDark">Continue</CustomText>
            </Button>
          )}

          {status === "error" && (
            <Link
              to="/dashboard"
              className="text-sm text-primary-500 hover:underline"
            >
              Go to dashboard
            </Link>
          )}
        </div>
      </Card>
    </DefaultContainer>
  );
}
