import type { ReactNode } from "react";
import type { Tag } from "@/types/Ui";
import ScrollChipRow from "./ScrollChipRow";

export default function CategoryRow({
  category,
  tag = "traveler",
  trailingAction,
}: {
  category: string[];
  tag?: Tag;
  trailingAction?: ReactNode;
}) {
  const label = tag === "traveler" ? "Accepts" : "Sending";
  return (
    <ScrollChipRow
      label={label}
      items={category}
      trailingAction={trailingAction}
    />
  );
}
