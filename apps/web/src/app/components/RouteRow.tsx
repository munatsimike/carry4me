import { META_ICONS } from "@/app/icons/MetaIcon";
import { InlineRow } from "./InlineRow";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { MoveRight } from "lucide-react";
import { toflag } from "@/app/Mapper";
import type { SvgIconComponent } from "@/types/Ui";

function CountryFlag({ country }: { country: string }) {
  const flag = toflag(country);
  if (!flag) return null;

  return <SvgIcon size="xs" Icon={flag as SvgIconComponent} />;
}

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
        <SvgIcon size="sm" Icon={META_ICONS.planeIcon} />
      </span>
      <InlineRow gap="2" className="items-center justify-center">
        <InlineRow gap="1">
          <CountryFlag country={origin} />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {origin}
          </CustomText>
        </InlineRow>
        <MoveRight className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
        <InlineRow gap="1">
          <CountryFlag country={destination} />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {destination}
          </CustomText>
        </InlineRow>
      </InlineRow>
    </InlineRow>
  );
}
