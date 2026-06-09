import { addMonths, isValid, parseISO, startOfDay } from "date-fns";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

const today = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const firstNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your first name");

export const lastNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your last name");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(
    (value) => isValidPhoneNumber(value),
    "Enter a valid phone number with a country code, for example +263...",
  );

export const otpCodeSchema = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d+$/, "The code should only contain numbers");

export const countrySchema = z.string().trim().min(1, "Select a country");

export const citySchema = z.string().trim().min(1, "Select a city");

export const customCitySchema = z.string().trim();

export const departureDateSchema = z
  .string()
  .trim()
  .min(1, "Select a departure date")
  .refine((value) => isValid(parseISO(value)), {
    message: "Select a valid departure date",
  })
  .refine(
    (value) => {
      const selected = startOfDay(parseISO(value));
      return selected >= today();
    },
    { message: "Departure date cannot be in the past" },
  )
  .refine(
    (value) => {
      const selected = startOfDay(parseISO(value));
      const maxDate = addMonths(today(), 12);
      return selected <= maxDate;
    },
    { message: "Departure must be within 12 months" },
  );

export const listingWeightSchema = z
  .number({ error: "Enter a valid weight" })
  .finite("Enter a valid weight")
  .min(1, "Weight must be at least 1kg")
  .max(200, "Weight cannot be more than 200kg");

export const pricePerKgSchema = z
  .number({ error: "Enter a valid price" })
  .finite("Enter a valid price")
  .min(1, "Price per kg must be at least 1");

export const goodsCategoriesSchema = z
  .array(z.string())
  .min(1, "Select at least one category");

function requiredAgreementSchema(message: string) {
  return z.boolean().refine((value) => value === true, { message });
}

export const confirmNoProhibitedItemsSchema = requiredAgreementSchema(
  "Please confirm your package contains no prohibited items",
);

export const understandTravelerInspectionSchema = requiredAgreementSchema(
  "Please confirm you understand the traveler may inspect the package",
);

export const agreeToTermsAndSafetySchema = z
  .boolean()
  .refine((value) => value === true, {
    message: "Please agree to the Terms & Safety Policy to continue",
  });

export const parcelItemSchema = z.object({
  quantity: z
    .number({ error: "Enter a valid quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  description: z
    .string()
    .trim()
    .min(2, "Describe what is in your parcel")
    .max(160, "Description must be 160 characters or fewer"),
});
