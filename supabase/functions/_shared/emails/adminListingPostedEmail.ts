import { escapeHtml } from "./escapeHtml.ts";
import { renderEmailLayout } from "./components/EmailLayout.ts";
import { FROM_ADDRESS, RESEND_API_URL } from "../notificationEmail.ts";

const DEFAULT_ADMIN_LISTING_NOTIFY_EMAILS = [
  "info@carry4me.uk",
  "munatsimike@gmail.com",
];

type ListingType = "trip" | "parcel";

export type AdminListingPostedDetails = {
  listingType: ListingType;
  listingId: string;
  routeLabel: string;
  categoriesLabel?: string;
  weightKg?: number;
  budgetPerKg?: number;
  travelDate?: string;
  availableSpaceKg?: number;
  pricePerKg?: number;
  currencySymbol: string;
};

function parseAdminNotifyEmails(): string[] {
  const raw = Deno.env.get("ADMIN_LISTING_NOTIFY_EMAILS")?.trim();
  if (!raw) {
    return DEFAULT_ADMIN_LISTING_NOTIFY_EMAILS;
  }

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function formatWeightKg(value: number): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} kg`;
}

function formatMoneyPerKg(value: number, currencySymbol: string): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${currencySymbol}${rounded}/kg`;
}

function formatTravelDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDetailRows(details: AdminListingPostedDetails): string {
  const rows: { label: string; value: string }[] = [
    { label: "Route", value: details.routeLabel },
  ];

  if (details.listingType === "parcel") {
    if (details.categoriesLabel) {
      rows.push({ label: "Category", value: details.categoriesLabel });
    }
    if (details.weightKg != null) {
      rows.push({ label: "Weight", value: formatWeightKg(details.weightKg) });
    }
    if (details.budgetPerKg != null) {
      rows.push({
        label: "Budget per kg",
        value: formatMoneyPerKg(details.budgetPerKg, details.currencySymbol),
      });
    }
  } else {
    if (details.travelDate) {
      rows.push({
        label: "Travel date",
        value: formatTravelDate(details.travelDate),
      });
    }
    if (details.availableSpaceKg != null) {
      rows.push({
        label: "Available space",
        value: formatWeightKg(details.availableSpaceKg),
      });
    }
    if (details.pricePerKg != null) {
      rows.push({
        label: "Price per kg",
        value: formatMoneyPerKg(details.pricePerKg, details.currencySymbol),
      });
    }
  }

  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#64748b;width:140px;vertical-align:top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#0f172a;font-weight:600;">
            ${escapeHtml(row.value)}
          </td>
        </tr>`,
    )
    .join("");
}

export function buildAdminListingPostedEmail(
  details: AdminListingPostedDetails,
): { subject: string; html: string; text: string } {
  const subject =
    details.listingType === "parcel" ? "New parcel posted" : "New trip posted";

  const intro =
    details.listingType === "parcel"
      ? "A sender has posted a new parcel on Carry4Me."
      : "A traveler has posted a new trip on Carry4Me.";

  const htmlBody = `
    <p style="margin:0 0 16px 0;">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${buildDetailRows(details)}
    </table>
    <p style="margin:20px 0 0 0;font-size:13px;line-height:20px;color:#64748b;">
      Listing ID: ${escapeHtml(details.listingId)}
    </p>`;

  const textLines = [
    intro,
    "",
    `Route: ${details.routeLabel}`,
  ];

  if (details.listingType === "parcel") {
    if (details.categoriesLabel) {
      textLines.push(`Category: ${details.categoriesLabel}`);
    }
    if (details.weightKg != null) {
      textLines.push(`Weight: ${formatWeightKg(details.weightKg)}`);
    }
    if (details.budgetPerKg != null) {
      textLines.push(
        `Budget per kg: ${formatMoneyPerKg(details.budgetPerKg, details.currencySymbol)}`,
      );
    }
  } else {
    if (details.travelDate) {
      textLines.push(`Travel date: ${formatTravelDate(details.travelDate)}`);
    }
    if (details.availableSpaceKg != null) {
      textLines.push(
        `Available space: ${formatWeightKg(details.availableSpaceKg)}`,
      );
    }
    if (details.pricePerKg != null) {
      textLines.push(
        `Price per kg: ${formatMoneyPerKg(details.pricePerKg, details.currencySymbol)}`,
      );
    }
  }

  textLines.push("", `Listing ID: ${details.listingId}`);

  return {
    subject,
    html: renderEmailLayout(htmlBody, { title: subject, preheader: intro }),
    text: textLines.join("\n"),
  };
}

export async function sendAdminListingPostedEmail(
  details: AdminListingPostedDetails,
  resendApiKey: string,
): Promise<{ sent: true; messageId: string | null }> {
  const recipients = parseAdminNotifyEmails();
  if (recipients.length === 0) {
    throw new Error("No admin listing notify emails configured");
  }

  const { subject, html, text } = buildAdminListingPostedEmail(details);

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  const responseText = await resendResponse.text();
  if (!resendResponse.ok) {
    throw new Error(
      `Resend API error (${resendResponse.status}): ${responseText}`,
    );
  }

  let messageId: string | null = null;
  try {
    const payload = JSON.parse(responseText) as { id?: string };
    messageId = payload.id ?? null;
  } catch {
    // keep null
  }

  return { sent: true, messageId };
}

export function currencySymbolForCountry(
  country: string | null | undefined,
): string {
  const key = country?.trim().toLowerCase() ?? "";
  if (
    key === "uk" ||
    key === "gb" ||
    key === "united kingdom"
  ) {
    return "£";
  }
  if (
    key === "netherlands" ||
    key === "nl" ||
    key === "france" ||
    key === "fr" ||
    key === "ireland" ||
    key === "ie" ||
    key === "germany" ||
    key === "de" ||
    key === "spain" ||
    key === "es" ||
    key === "eu" ||
    key === "europe"
  ) {
    return "€";
  }
  return "$";
}

export function formatListingRouteLabel(
  originCity: string,
  destinationCity: string,
): string {
  const origin = originCity.trim();
  const destination = destinationCity.trim();
  if (!origin && !destination) return "—";
  if (!origin) return destination;
  if (!destination) return origin;
  return `${origin} – ${destination}`;
}
