import { META_ICONS } from "../icons/MetaIcon";
import IconTextRow from "./card/IconTextRow";

export default function WeightRow({ weight }: { weight: number }) {
  return (
    <IconTextRow
      Icon={META_ICONS.scale}
      label={`${weight.toString()} ${"kg"}`}
    />
  );
}
