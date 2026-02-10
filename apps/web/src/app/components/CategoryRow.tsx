import type { Tag } from "@/types/Ui";
import LabelTextRow from "./LabelTextRow";
import IconTextRow from "./card/IconTextRow";
import { META_ICONS } from "../icons/MetaIcon";

export default function CategoryRow({
  category,
  tag = "traveler",
}: {
  category: string;
  tag?: Tag;
}) {
  return tag === "traveler" ? (
    <LabelTextRow label={"Accepts : "} text={category} />
  ) : (
    <IconTextRow Icon={META_ICONS.parcelBoxOutlined} label={category} />
  );
}
