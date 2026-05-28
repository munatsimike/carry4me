import PolicyPageLayout from "./policy/PolicyPageLayout";
import { prohibitedItemsContent } from "./policy/content/prohibitedItemsContent";

export default function ProhibitedItemsPage() {
  return <PolicyPageLayout {...prohibitedItemsContent} />;
}
