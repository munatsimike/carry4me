import type { Tag } from "@/types/Ui";
import LabelTextRow from "./LabelTextRow";

export default function CategoryRow({
  category,
  tag = "traveler",
}: {
  category: string[];
  tag?: Tag;
}) {
  const label = tag === "traveler" ? "Accepts : " : "Sending : ";
  return <LabelTextRow label={label} text={category} />;
}
