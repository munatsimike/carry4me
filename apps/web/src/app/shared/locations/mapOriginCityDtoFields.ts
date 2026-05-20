import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import { resolveOriginCityForSave } from "./cityOptions";

type OriginCityFormValues = Pick<
  ParcelFormFields,
  "originCity" | "originCustomCity"
>;

export function mapOriginCityDtoFields(values: OriginCityFormValues): {
  origin_city: string;
  origin_city_is_custom: boolean;
} {
  const resolved = resolveOriginCityForSave(
    values.originCity,
    values.originCustomCity,
  );

  return {
    origin_city: resolved.city,
    origin_city_is_custom: resolved.isCustom,
  };
}

type OriginRouteDirtyFields = {
  originCountry?: boolean;
  originCity?: boolean;
  originCustomCity?: boolean;
};

export function hasOriginCityChanges(dirtyFields: OriginRouteDirtyFields): boolean {
  return Boolean(
    dirtyFields.originCountry ||
      dirtyFields.originCity ||
      dirtyFields.originCustomCity,
  );
}
