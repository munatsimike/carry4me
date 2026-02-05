import { META_ICONS } from "../icons/MetaIcon";
import IconTextRow from "./card/IconTextRow";

export default function TravelerRow({
  name,
  surname,
}: {
  name: string;
  surname?: string;
}) {
  return (
    <IconTextRow
      Icon={META_ICONS.travelerOutline}
      label={`${name} ${surname ? surname : ""}`}
      iconSize="md"
    />
  );
}
