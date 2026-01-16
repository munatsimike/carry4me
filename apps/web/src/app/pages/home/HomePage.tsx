import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps, benefits } from "../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";
import Benefits from "./sections/benefits/Benefits";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks steps={steps} />
      <TrustAndSafety items={safetyRules} />
      <Benefits items={benefits} />
    </>
  );
}
