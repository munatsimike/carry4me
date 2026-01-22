import { META_ICONS } from "@/app/icons/MetaIcon";
import IconTextRow from "./card/IconTextRow";
import { InlineRow } from "./InlineRow";

export default function RouteRow({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  return (
    <InlineRow>
      <IconTextRow Icon={META_ICONS.planeIcon} label={origin} />
      <IconTextRow
        iconSize="xsm"
        Icon={META_ICONS.arrow}
        label={destination}
      />
    </InlineRow>
  );
}
