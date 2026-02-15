import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits, questions } from "../../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";
import FaqSection from "./sections/faqSection/FaqSection";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";

export default function HomePage() {
  const { toast } = useToast();

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
  return (
    <>
      <HeroSection />
      <HowItWorks steps={steps} />
      <TrustAndSafety items={safetyRules} />
      <Benefits items={benefits} />
      <FaqSection items={questions} />
    </>
  );
}
