import type { FormValues } from "@/types/Ui";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { normalizeGoodsItem } from "@/app/components/GoodsManifestTable";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";
import { format, isValid, parseISO } from "date-fns";

const emptyParcelItem = {
  quantity: 1,
  description: "",
  size: "",
  condition: "new" as const,
};

function normalizeDepartureDate(value: string | undefined): string {
  if (!value?.trim()) return "";
  const parsed = parseISO(value);
  if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  return value.slice(0, 10);
}

export function parcelListingToFormValues(data: ParcelListing): FormValues {
  return {
    id: data.id,
    originCountry: data.route.originCountry,
    ...toOriginCityFormFields(
      data.route.originCity,
      data.route.originCityIsCustom,
    ),
    destinationCountry: data.route.destinationCountry,
    destinationCity: data.route.destinationCity,
    goodsCategoryIds: data.goodsCategory.map((category) => category.id),
    itemDescriptions: data.items.length
      ? data.items.map((item) => normalizeGoodsItem(item))
      : [emptyParcelItem],
    weight: data.weightKg,
    pricePerKg: data.pricePerKg,
    confirmNoProhibitedItems: false,
    understandTravelerInspection: false,
    senderId: data.user.id ?? "",
  };
}

export function tripListingToFormValues(data: TripListing): FormValues {
  return {
    id: data.id,
    originCountry: data.route.originCountry,
    ...toOriginCityFormFields(
      data.route.originCity,
      data.route.originCityIsCustom,
    ),
    destinationCountry: data.route.destinationCountry,
    destinationCity: data.route.destinationCity,
    goodsCategoryIds: data.goodsCategory.map((category) => category.id),
    itemDescriptions: [],
    weight: data.capacityKg ?? data.weightKg,
    pricePerKg: data.pricePerKg,
    senderId: data.user.id ?? "",
    departureDate: normalizeDepartureDate(data.departDate),
  };
}
