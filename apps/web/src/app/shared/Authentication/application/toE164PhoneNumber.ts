import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { toIsoCountryCode } from "@/app/Mapper";

export function toE164PhoneNumber(
  countryCode: string,
  localPhoneNumber: string,
): string | null {
  const isoCountryCode = toIsoCountryCode(countryCode);

  if (!isoCountryCode || /^\s*\+/.test(localPhoneNumber)) return null;

  const normalizedLocalNumber = localPhoneNumber.trim();
  const parsed = parsePhoneNumberFromString(
    normalizedLocalNumber,
    isoCountryCode as CountryCode,
  );

  if (parsed?.isValid() || parsed?.isPossible()) return parsed.number;

  if (!normalizedLocalNumber.startsWith("0")) {
    const parsedWithTrunkPrefix = parsePhoneNumberFromString(
      `0${normalizedLocalNumber}`,
      isoCountryCode as CountryCode,
    );

    if (parsedWithTrunkPrefix?.isValid()) return parsedWithTrunkPrefix.number;
  }

  return null;
}
