import type { Tag } from "@/types/Ui";
import LableTextRow from "./LabelTextRow";
import IconTextRow from "./card/IconTextRow";
import { META_ICONS } from "../icons/MetaIcon";

export default function CategoryRow({
  category,
  tag = "traveler",
}: {
  category: string[];
  tag?: Tag;
}) {
  return tag === "traveler" ? (
    <LableTextRow label={"Accepts : "} text={category.join("|")} />
  ) : (
    <IconTextRow Icon={META_ICONS.parcelBox} label={category.join("|")} />
  );
}
