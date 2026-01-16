import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { safetyRules, steps } from "../Data";
import TrustAndSafety from "./sections/trust&safety/Trust&Safety";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <HowItWorks steps={steps} />
      <TrustAndSafety items={safetyRules} />
    </div>
  );
}
