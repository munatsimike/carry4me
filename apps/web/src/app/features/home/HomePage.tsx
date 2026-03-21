import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits, questions } from "../../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";
import FaqSection from "./sections/faqSection/FaqSection";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import { useSearchParams } from "react-router-dom";
import CustomModal from "@/app/components/CustomModal";
import { useAuthModal } from "@/app/shared/Authentication/AuthModalContext";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { openAuthModal } = useAuthModal();
  const isPassReset = searchParams.get("reset") === "success";

  useEffect(() => {
    const raw = sessionStorage.getItem("redirectToast");
    if (!raw) return;

    sessionStorage.removeItem("redirectToast");

    const data = JSON.parse(raw) as {
      message: string;
      variant: "success" | "info" | "warning" | "error";
    };
    toast(data.message, { variant: data.variant });
  }, [toast]);

  const handleClose = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("reset"); // THIS is what matters
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
            onClose={handleClose}
            onSignIn={() => openAuthModal({ mode: "signin" })}
          />
        )}
      </AnimatePresence>
    </>
  );
}

type ModalProps = {
  onSignIn: () => void;
  onClose: () => void;
};

function Modal({ onSignIn, onClose }: ModalProps) {
  return (
    <CustomModal onClose={onClose} width="md">
      <div className="p-4 text-center">
        <h2 className="text-xl font-medium mb-4">Please sign in</h2>

        <p className="text-sm text-gray-500 mb-6">
          Your password was reset successfully. Sign in to continue.
        </p>

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
