import PolicyPageLayout from "./policy/PolicyPageLayout";
import { aboutContent } from "./policy/content/aboutContent";

export default function AboutPage() {
  return <PolicyPageLayout {...aboutContent} />;
}
