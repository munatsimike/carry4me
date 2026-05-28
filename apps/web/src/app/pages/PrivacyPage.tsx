import PolicyPageLayout from "./policy/PolicyPageLayout";
import { privacyContent } from "./policy/content/privacyContent";

export default function PrivacyPage() {
  return <PolicyPageLayout {...privacyContent} />;
}
