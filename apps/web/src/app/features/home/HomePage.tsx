import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits, questions } from "../../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";
import FaqSection from "./sections/faqSection/FaqSection";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import CustomModal from "@/app/components/CustomModal";
import { useAuthModal } from "@/app/shared/Authentication/AuthModalContext";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
export default function HomePage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const isPassReset = searchParams.get("reset") === "success";
  const isSignup = searchParams.get("signup") === "success";
   const navigate = useNavigate();
  const isResetLink = searchParams.get("reset-sent")?.trim() === "success";
    const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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

  useEffect(() => {
    if (!isResetLink) return;
    const timer = setTimeout(() => {
      toast("Password reset link sent. Check your email.", {
        variant: "success",
      });
      handleClose("reset-sent");
    }, 700);
    return () => clearTimeout(timer);
  }, [isResetLink]);

  const handleClose = (param: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete(param); // THIS is what matters
    setSearchParams(next);
  };
  return (
    <>
      <HeroSection />
      <HowItWorks steps={steps} />
      <TrustAndSafety items={safetyRules} />
      <Benefits items={benefits} />
      <FaqSection items={questions} />
      <AnimatePresence>
        {isPassReset && (
          <Modal
            onClose={() => handleClose("reset")}
            onSignIn={() => openAuthModal({ mode: "signin" })}
          />
        )}

        {isSignup && (
          <Modal
            onClose={() => handleClose("signup")}
            onSignIn={() => openAuthModal({ mode: "signin" })}
          />
        )}
      </AnimatePresence>
    </>
  );
}

type Param = "reset" | "signup";
type ModalProps = {
  onSignIn: () => void;
  onClose: () => void;
  param?: Param;
};

function Modal({ onSignIn, onClose, param = "signup" }: ModalProps) {
  return (
    <CustomModal onClose={onClose} width="lg">
      <div className="flex flex-col gap-3 p-4">
        <CustomText
          as="h2"
          textSize="lg"
          className="font-medium"
          textVariant="primary"
        >
          {param === "signup"
            ? "Account created successfully"
            : "Password updated successfully"}
        </CustomText>

        <CustomText as="p" className="mb-3" textVariant="secondary">
          {param === "signup"
            ? "Your account was created successfully"
            : "Your password was reset successfully"}
          .Sign in to continue.
        </CustomText>

        <div className="flex justify-end gap-4">
          <Button onClick={onClose} variant="outline" size="md">
            Close
          </Button>
          <Button
            onClick={() => {
              onSignIn();
              onClose();
            }}
            variant="primary"
            size="md"
          >
            Sign In
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
