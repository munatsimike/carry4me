import PolicyPageLayout from "./policy/PolicyPageLayout";
import { pricingContent } from "./policy/content/pricingContent";

export default function PricingPage() {
  return <PolicyPageLayout {...pricingContent} />;
}
