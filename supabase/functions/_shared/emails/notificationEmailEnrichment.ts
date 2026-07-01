import { createClient } from "npm:@supabase/supabase-js@2";
import type { NotificationRow } from "../notificationEmail.ts";
import type { NotificationEmailInput } from "./utils.ts";

type CarryRequestRow = {
  sender_user_id: string;
  traveler_user_id: string;
};

type ProfileContactRow = {
  full_name: string | null;
  phone_number: string | null;
  country_code: string | null;
};

function toDialCode(country: string | null | undefined): string | null {
  if (!country?.trim()) return null;

  switch (country.trim()) {
    case "UK":
    case "GB":
    case "United Kingdom":
      return "+44";
    case "USA":
    case "US":
    case "United States":
    case "United States of America":
      return "+1";
    case "IE":
    case "Ireland":
      return "+353";
    case "Zimbabwe":
    case "ZW":
      return "+263";
    case "NL":
    case "Netherlands":
      return "+31";
    case "FR":
    case "France":
      return "+33";
    default:
      return null;
  }
}

export function formatProfilePhone(
  phoneNumber: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  if (!phoneNumber?.trim()) return null;

  const trimmed = phoneNumber.trim();
  if (trimmed.startsWith("+")) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  const dialCode = countryCode ? toDialCode(countryCode) : null;
  if (!digits || !dialCode) return trimmed;

  const dialDigits = dialCode.replace(/\D/g, "");
  if (digits.startsWith(dialDigits)) return `+${digits}`;

  return `${dialCode}${digits.replace(/^0+/, "")}`;
}

function formatContactName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed : null;
}

function getCarryRequestId(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const value = metadata?.carry_request_id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function loadCarryRequest(
  supabaseAdmin: ReturnType<typeof createClient>,
  carryRequestId: string,
): Promise<CarryRequestRow | null> {
  const { data, error } = await supabaseAdmin
    .from("carry_requests")
    .select("sender_user_id, traveler_user_id")
    .eq("id", carryRequestId)
    .maybeSingle<CarryRequestRow>();

  if (error) {
    console.error("Failed to load carry request for email enrichment:", error);
    return null;
  }

  return data;
}

async function loadProfileContact(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ name: string | null; phone: string | null }> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone_number, country_code")
    .eq("id", userId)
    .maybeSingle<ProfileContactRow>();

  if (error) {
    console.error("Failed to load profile contact for email enrichment:", error);
    return { name: null, phone: null };
  }

  return {
    name: formatContactName(data?.full_name),
    phone: formatProfilePhone(data?.phone_number, data?.country_code),
  };
}

function buildContactParagraphs(
  heading: string,
  contact: { name: string | null; phone: string | null },
  fallbackPhoneMessage: string,
): string[] {
  const paragraphs = [heading];

  if (contact.name) {
    paragraphs.push(`Name: ${contact.name}`);
  }

  if (contact.phone) {
    paragraphs.push(`Phone: ${contact.phone}`);
  } else {
    paragraphs.push(fallbackPhoneMessage);
  }

  return paragraphs;
}

function browseCtaForRecipient(recipientIsSender: boolean): {
  link: string;
  ctaLabel: string;
} {
  return recipientIsSender
    ? { link: "/travelers", ctaLabel: "Browse trips" }
    : { link: "/parcels", ctaLabel: "Browse parcels" };
}

export async function enrichNotificationForEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  notification: NotificationRow,
): Promise<NotificationEmailInput> {
  const base: NotificationEmailInput = {
    title: notification.title,
    body: notification.body,
    link: notification.link,
    type: notification.type,
  };

  const type = notification.type?.trim().toUpperCase() ?? "";

  if (type === "PAYMENT_RELEASED" || type === "PARCEL_DELIVERED" || type === "TRAVELER_BANK_PAYOUT") {
    return { ...base, ctaLabel: null };
  }

  if (type === "PARCEL_RECEIVED") {
    return { ...base, ctaLabel: null };
  }

  const carryRequestId = getCarryRequestId(notification.metadata);
  if (!carryRequestId) {
    return base;
  }

  const carryRequest = await loadCarryRequest(supabaseAdmin, carryRequestId);
  if (!carryRequest) {
    return base;
  }

  const recipientIsSender =
    notification.user_id === carryRequest.sender_user_id;
  const recipientIsTraveler =
    notification.user_id === carryRequest.traveler_user_id;

  switch (type) {
    case "REQUEST_ACCEPTED": {
      const senderMustPay = recipientIsSender;
      return {
        ...base,
        body: senderMustPay
          ? "The traveler accepted your request to carry your parcel. Make payment to continue. Your payment will be held securely until delivery is complete."
          : base.body,
        link: base.link?.trim() ? base.link : "/requests",
        paymentRequired: senderMustPay,
        ctaLabel: senderMustPay ? "Make payment" : "View request",
      };
    }
    case "PAYMENT_COMPLETED": {
      if (recipientIsTraveler) {
        const senderContact = await loadProfileContact(
          supabaseAdmin,
          carryRequest.sender_user_id,
        );

        return {
          ...base,
          title: "Payment received",
          body:
            "The sender has paid. Please arrange the package handover and confirm it once completed.",
          extraParagraphs: buildContactParagraphs(
            "Sender contact details:",
            senderContact,
            "Phone: not available yet. Open Carry4Me to view the sender's contact details.",
          ),
          ctaLabel: null,
        };
      }

      if (recipientIsSender) {
        const travelerContact = await loadProfileContact(
          supabaseAdmin,
          carryRequest.traveler_user_id,
        );

        return {
          ...base,
          title: "Payment completed",
          body:
            "Payment has been completed. Please arrange the package handover with the traveler and confirm the handover.",
          extraParagraphs: buildContactParagraphs(
            "Traveler contact details:",
            travelerContact,
            "Phone: not available yet. Open Carry4Me to view the traveler's contact details.",
          ),
          ctaLabel: null,
        };
      }

      return base;
    }
    case "REQUEST_REJECTED":
    case "REQUEST_CANCELED": {
      const browse = browseCtaForRecipient(recipientIsSender);
      return {
        ...base,
        link: browse.link,
        ctaLabel: browse.ctaLabel,
      };
    }
    default:
      return base;
  }
}
