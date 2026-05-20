export const OTHER_CITY_OPTION = "Other";

export function withOtherCityOption(cities: string[]): string[] {
  if (cities.includes(OTHER_CITY_OPTION)) {
    return cities;
  }
  return [...cities, OTHER_CITY_OPTION];
}

export function isOtherCitySelection(city: string | undefined): boolean {
  return city?.trim() === OTHER_CITY_OPTION;
}

export function resolveOriginCityForSave(
  originCity: string,
  originCustomCity: string,
): { city: string; isCustom: boolean } {
  if (isOtherCitySelection(originCity)) {
    return {
      city: originCustomCity.trim(),
      isCustom: true,
    };
  }

  return {
    city: originCity.trim(),
    isCustom: false,
  };
}

export function toOriginCityFormFields(
  city: string,
  isCustom: boolean,
): { originCity: string; originCustomCity: string } {
  if (isCustom) {
    return {
      originCity: OTHER_CITY_OPTION,
      originCustomCity: city,
    };
  }

  return {
    originCity: city,
    originCustomCity: "",
  };
}
