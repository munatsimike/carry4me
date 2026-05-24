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
  originCity,
  destinationCity,
}: {
  origin: string;
  destination: string;
  originCity?: string;
  destinationCity?: string;
}) {
  const originCityLabel = originCity?.trim();
  const destinationCityLabel = destinationCity?.trim() ?? "Harare";

  const hasOriginCity = !!originCityLabel;
  const hasDestinationCity = !!destinationCityLabel;
  const hasCities = hasOriginCity || hasDestinationCity;

  return (
    <InlineRow className="relative overflow-visible">
      <span>
        <SvgIcon size="sm" Icon={META_ICONS.planeIcon} />
      </span>

      <InlineRow
        gap="2"
        className="group/route relative items-center justify-center overflow-visible"
      >
        <InlineRow gap="1" className="items-center">
          <CountryFlag country={origin} />

          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium whitespace-nowrap"
          >
            {origin}
          </CustomText>
        </InlineRow>

        <MoveRight
          className="
            h-4 w-4 text-neutral-800
            transition-transform duration-300 ease-out
            group-hover/route:translate-x-0.5
          "
          strokeWidth={1.5}
        />

        <InlineRow gap="1" className="items-center">
          <CountryFlag country={destination} />

          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium whitespace-nowrap"
          >
            {destination}
          </CustomText>
        </InlineRow>

        {hasCities ? (
          <div
            className="
              pointer-events-none absolute left-1/2 bottom-full z-50
              mb-1 -translate-x-1/2
              whitespace-nowrap rounded-full
              border border-blue-100 bg-blue-50 border border-blue-100 px-3 py-1.5
              text-xs font-medium text-neutral-700
              shadow-lg

              opacity-0 translate-y-1 scale-95
              transition-all duration-300 ease-out

              group-hover/route:translate-y-0
              group-hover/route:scale-100
              group-hover/route:opacity-100
            "
          >
            <span>{originCityLabel || origin}</span>
            <span className="mx-1 text-neutral-400">→</span>
            <span>{destinationCityLabel || destination}</span>
          </div>
        ) : null}
      </InlineRow>
    </InlineRow>
  );
}