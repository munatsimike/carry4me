import PolicyPageLayout from "./policy/PolicyPageLayout";
import { termsContent } from "./policy/content/termsContent";

export default function TermsPage() {
  return <PolicyPageLayout {...termsContent} />;
}
