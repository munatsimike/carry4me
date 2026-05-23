import { normalizeCountryCode } from "@/app/Mapper";
import {
  getCityOptions,
} from "@/app/hookes/useLocation";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";
import type { MyLocation } from "@/app/shared/Authentication/domain/MyLocation";
import {
  FIXED_DESTINATION_CITY,
  FIXED_DESTINATION_COUNTRY,
} from "./fixedDestination";
import { OTHER_CITY_OPTION, toOriginCityFormFields } from "./cityOptions";

export function getDestinationDefaultsFromProfile(): {
  destinationCountry: string;
  destinationCity: string;
} {
  return {
    destinationCountry: FIXED_DESTINATION_COUNTRY,
    destinationCity: FIXED_DESTINATION_CITY,
  };
}

export function getOriginDefaultsFromProfile(
  profile: UserProfile | null | undefined,
  locations?: MyLocation[],
): {
  originCountry: string;
  originCity: string;
  originCustomCity: string;
} {
  const empty = {
    originCountry: "",
    originCity: "",
    originCustomCity: "",
  };

  if (!profile) return empty;

  const originCountry =
    profile.countryCode?.trim() ||
    normalizeCountryCode(profile.country ?? "") ||
    "";

  if (!originCountry) return empty;

  const city = profile.city?.trim() ?? "";
  if (!city) {
    return { ...empty, originCountry };
  }

  if (locations?.length) {
    const cities = getCityOptions(locations, originCountry);
    const matched = cities.find(
      (option) => option.toLowerCase() === city.toLowerCase(),
    );

    if (matched) {
      return {
        originCountry,
        originCity: matched,
        originCustomCity: "",
      };
    }

    return {
      originCountry,
      originCity: OTHER_CITY_OPTION,
      originCustomCity: city,
    };
  }

  return {
    originCountry,
    ...toOriginCityFormFields(city, false),
  };
}
