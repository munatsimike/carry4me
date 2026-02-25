import { META_ICONS } from "@/app/icons/MetaIcon";

import { InlineRow } from "./InlineRow";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { MoveRight } from "lucide-react";

export default function RouteRow({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  return (
    <InlineRow>
      <span>
        <SvgIcon size={"sm"} Icon={META_ICONS.planeIcon} />
      </span>
      <InlineRow gap="2" className="items-center justify-center">
        <InlineRow gap="1">
          <SvgIcon size={"sm"} Icon={META_ICONS.ukFlag} />
          <CustomText textSize="xsm" textVariant="primary">
            {origin}
          </CustomText>
        </InlineRow>

        <MoveRight className="text-neutral-400" strokeWidth={1.5} />
        <InlineRow gap="1">
          <SvgIcon size={"sm"} Icon={META_ICONS.zimFlag} />
          <CustomText textSize="xsm" textVariant="primary">
            {destination}
          </CustomText>
        </InlineRow>
      </InlineRow>
    </InlineRow>
  );
}
