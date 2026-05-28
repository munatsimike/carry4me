import PolicyPageLayout from "./policy/PolicyPageLayout";
import { helpContent } from "./policy/content/helpContent";

export default function HelpPage() {
  return <PolicyPageLayout {...helpContent} />;
}
