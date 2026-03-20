import type { Tag } from "@/types/Ui";
import ScrollChipRow from "./ScrollChipRow";

export default function CategoryRow({
  category,
  tag = "traveler",
}: {
  category: string[];
  tag?: Tag;
}) {
  const label = tag === "traveler" ? "Accepts" : "Sending";
  return <ScrollChipRow label={label} items={category} />;
}


