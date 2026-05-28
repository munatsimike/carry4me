import z from "zod";
import { toE164PhoneNumber } from "../application/toE164PhoneNumber";

export const phoneWithCountrySchema = z
  .object({
    countryCode: z.string().min(1, "Select a country code"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Enter your phone number")
      .regex(/^\d+$/, "Enter numbers only, without the country code"),
  })
  .superRefine((value, ctx) => {
    if (toE164PhoneNumber(value.countryCode, value.phoneNumber)) return;

    ctx.addIssue({
      code: "custom",
      path: ["phoneNumber"],
      message: "Enter a valid local phone number",
    });
  });

export type PhoneWithCountryFields = z.infer<typeof phoneWithCountrySchema>;
