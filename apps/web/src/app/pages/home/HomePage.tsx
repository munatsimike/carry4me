import { HeroSection } from "./sections/heroSection/HeroSection";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import { steps } from "../Data";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <HowItWorks steps={steps} />
    </div>
  );
}
