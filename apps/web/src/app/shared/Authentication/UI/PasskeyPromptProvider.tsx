import CustomModal from "@/app/components/CustomModal";
import LineDivider from "@/app/components/LineDivider";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { checkBox, checkBoxSvg } from "@/app/lib/cn";
import { COMPLETE_PROFILE_PATH } from "@/app/shared/Authentication/domain/profileCompletion";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { supabase } from "@/app/shared/supabase/client";
import { AnimatePresence } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import {
  canOfferPasskeyEnrollment,
  enrollPasskey,
  listPasskeys,
} from "../application/passkeyAuth";
import {
  isPasskeyPromptDismissed,
  setPasskeyPromptDismissed,
} from "../application/passkeyPromptPreference";
import { isAuthModalActive, useSignInModal } from "../SignInModalContext";
import { useEmailVerification } from "./EmailVerificationContext";

type PasskeyPromptContextValue = {
  /** Re-run passkey prompt eligibility (e.g. after manual profile completion). */
  requestPasskeyPromptCheck: () => void;
};

const PasskeyPromptContext = createContext<PasskeyPromptContextValue | null>(
  null,
);

/** Delay after login before showing the passkey prompt (ms). */
const PASSKEY_PROMPT_DELAY_MS = 3000;

export function PasskeyPromptProvider({ children }: { children: ReactNode }) {
  const { user, loading, profileIncomplete } = useAuth();
  const { state: authModalState } = useSignInModal();
  const { isBlockingCompleteProfileRedirect } = useEmailVerification();
  const location = useLocation();
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();

  const [open, setOpen] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [passkeyActionLoading, setPasskeyActionLoading] = useState(false);

  const [signInPasskeyCheckPending, setSignInPasskeyCheckPending] =
    useState(false);
  const prevProfileIncompleteRef = useRef<boolean | null>(null);
  const checkInFlightRef = useRef(false);
  const shownThisSessionRef = useRef(false);
  const promptDelayTimeoutRef = useRef<number | null>(null);

  const clearPromptDelay = useCallback(() => {
    if (promptDelayTimeoutRef.current !== null) {
      window.clearTimeout(promptDelayTimeoutRef.current);
      promptDelayTimeoutRef.current = null;
    }
  }, []);

  const closePrompt = useCallback(
    (persistDismiss = false) => {
      if (persistDismiss && neverShowAgain && user?.id) {
        setPasskeyPromptDismissed(user.id, true);
      }
      setNeverShowAgain(false);
      setOpen(false);
    },
    [neverShowAgain, user?.id],
  );

  const tryShowPasskeyPrompt = useCallback(async (userId: string) => {
    if (checkInFlightRef.current || open || shownThisSessionRef.current) return;
    if (isPasskeyPromptDismissed(userId)) return;

    checkInFlightRef.current = true;
    try {
      const support = canOfferPasskeyEnrollment();
      if (!support.supported) {
        console.info(
          "[Passkey] Skipping login prompt:",
          support.reason,
          support.detail,
        );
        return;
      }

      const passkeys = await listPasskeys();
      if (passkeys.length > 0) return;

      shownThisSessionRef.current = true;
      clearPromptDelay();
      promptDelayTimeoutRef.current = window.setTimeout(() => {
        promptDelayTimeoutRef.current = null;
        if (isPasskeyPromptDismissed(userId)) return;
        setNeverShowAgain(false);
        setOpen(true);
      }, PASSKEY_PROMPT_DELAY_MS);
    } catch (error) {
      console.error("[Passkey] Could not evaluate passkey prompt:", error);
    } finally {
      checkInFlightRef.current = false;
    }
  }, [clearPromptDelay, open]);

  /** Call after sign-in UI finishes (OTP modal closed, profile loaded). */
  const requestPasskeyPromptCheck = useCallback(() => {
    setSignInPasskeyCheckPending(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearPromptDelay();
        setSignInPasskeyCheckPending(false);
        shownThisSessionRef.current = false;
        setOpen(false);
        setNeverShowAgain(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [clearPromptDelay]);

  useEffect(() => () => clearPromptDelay(), [clearPromptDelay]);

  useEffect(() => {
    if (!user?.id || loading) return;

    const profileJustCompleted =
      prevProfileIncompleteRef.current === true && !profileIncomplete;
    prevProfileIncompleteRef.current = profileIncomplete;

    if (profileIncomplete) return;
    if (isBlockingCompleteProfileRedirect) return;
    if (location.pathname === COMPLETE_PROFILE_PATH) return;
    if (isAuthModalActive(authModalState)) return;

    const shouldCheck = signInPasskeyCheckPending || profileJustCompleted;
    if (!shouldCheck) return;

    setSignInPasskeyCheckPending(false);
    void tryShowPasskeyPrompt(user.id);
  }, [
    authModalState,
    isBlockingCompleteProfileRedirect,
    loading,
    location.pathname,
    profileIncomplete,
    signInPasskeyCheckPending,
    tryShowPasskeyPrompt,
    user?.id,
  ]);

  const handleSetPasskey = async () => {
    setPasskeyActionLoading(true);
    try {
      await enrollPasskey();
      toast("Passkey successfully added.", { variant: "success" });
      setNeverShowAgain(false);
      setOpen(false);
    } catch (error) {
      showSupabaseError(error);
    } finally {
      setPasskeyActionLoading(false);
    }
  };

  return (
    <PasskeyPromptContext.Provider value={{ requestPasskeyPromptCheck }}>
      {children}

      <AnimatePresence>
        {open ? (
          <CustomModal
            width="lg"
            onClose={() => closePrompt(true)}
          >
            <div className="flex flex-col gap-3">
              <CustomText
                as="h2"
                textSize="lg"
                textVariant="primary"
                className="font-medium"
              >
                Secure your account with a passkey
              </CustomText>

              <LineDivider heightClass="my-1" />

              <CustomText textSize="sm" textVariant="secondary">
                Passkeys let you sign in faster with Face ID, fingerprint,
                Windows Hello, or your device PIN.
              </CustomText>

              <label
                htmlFor="passkey-prompt-never-show"
                className="flex cursor-pointer items-center justify-start gap-3"
              >
                <span className="relative inline-flex shrink-0">
                  <input
                    id="passkey-prompt-never-show"
                    type="checkbox"
                    checked={neverShowAgain}
                    onChange={(event) =>
                      setNeverShowAgain(event.target.checked)
                    }
                    className={checkBox}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className={checkBoxSvg}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <CustomText as="span" textVariant="formText" textSize="sm">
                  Never show this again
                </CustomText>
              </label>

              <LineDivider heightClass="my-1" />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={passkeyActionLoading}
                  onClick={() => closePrompt(true)}
                >
                  Maybe later
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isBusy={passkeyActionLoading}
                  disabled={passkeyActionLoading}
                  onClick={() => void handleSetPasskey()}
                >
                  Set passkey
                </Button>
              </div>
            </div>
          </CustomModal>
        ) : null}
      </AnimatePresence>
    </PasskeyPromptContext.Provider>
  );
}

export function usePasskeyPrompt() {
  const context = useContext(PasskeyPromptContext);
  if (!context) {
    throw new Error(
      "usePasskeyPrompt must be used inside <PasskeyPromptProvider />",
    );
  }
  return context;
}
