import PolicyPageLayout from "./policy/PolicyPageLayout";
import { safetyContent } from "./policy/content/safetyContent";

export default function SafetyPage() {
  return <PolicyPageLayout {...safetyContent} />;
}
