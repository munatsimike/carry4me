import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits, questions } from "../../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";
import FaqSection from "./sections/faqSection/FaqSection";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CustomModal from "@/app/components/CustomModal";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import {
  getDefaultAuthedPath,
  isSuspended,
} from "@/app/shared/Authentication/domain/accountStatus";
import { COMPLETE_PROFILE_PATH, needsCompleteProfile } from "@/app/shared/Authentication/domain/profileCompletion";
export default function HomePage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSignup = searchParams.get("signup") === "success";
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    if (isSuspended(profile)) return;

    if (user && !loading) {
      navigate(
        needsCompleteProfile(profile) ? COMPLETE_PROFILE_PATH : getDefaultAuthedPath(profile),
      );
    }
  }, [user, loading, profile, navigate]);

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
  return (
    <>
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
