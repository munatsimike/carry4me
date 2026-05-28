import PolicyPageLayout from "./policy/PolicyPageLayout";
import { refundsContent } from "./policy/content/refundsContent";

export default function RefundsPage() {
  return <PolicyPageLayout {...refundsContent} />;
}
