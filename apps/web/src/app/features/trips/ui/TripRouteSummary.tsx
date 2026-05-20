import { META_ICONS } from "@/app/icons/MetaIcon";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import { FIXED_DESTINATION_COUNTRY } from "@/app/shared/locations/fixedDestination";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { format, isValid, parseISO } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";

type TripRouteSummaryProps = {
  originCountry: string;
  originCity: string;
  originCustomCity: string;
  destinationCountry: string;
  departureDate: string;
};

function formatCity(city: string, customCity: string): string {
  if (!city) return "—";
  if (isOtherCitySelection(city)) {
    return customCity.trim() || "Other city";
  }
  return city;
}

function formatDepartureDate(value: string): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "—";
  return format(parsed, "d MMM yyyy");
}

export default function TripRouteSummary({
  originCountry,
  originCity,
  originCustomCity,
  destinationCountry,
  departureDate,
}: TripRouteSummaryProps) {
  const origin = formatCity(originCity, originCustomCity);
  const dateLabel = formatDepartureDate(departureDate);

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-primary">
        <span className="font-medium">
          {origin}
          {originCountry ? `, ${originCountry}` : ""}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <span className="inline-flex items-center gap-1.5 font-medium">
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          {destinationCountry || FIXED_DESTINATION_COUNTRY}
        </span>
      </div>
      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-600">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        <span>Departing {dateLabel}</span>
      </div>
    </div>
  );
}
