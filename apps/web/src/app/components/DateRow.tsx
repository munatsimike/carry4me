import { META_ICONS } from "../icons/MetaIcon";
import IconTextRow from "./card/IconTextRow";

export default function DateRow({ date }: { date: string }) {
  return <IconTextRow Icon={META_ICONS.calender} label={date} />;
}
