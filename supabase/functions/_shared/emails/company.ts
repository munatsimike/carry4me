/**
 * Company branding for transactional emails.
 * Override via Supabase Edge Function secrets / env.
 * Defaults mirror apps/web Footer.tsx (Contact, Locations, Brand).
 */

export type EmailCompanyConfig = {
  companyName: string;
  supportEmail: string;
  phone: string;
  address: string;
  websiteUrl: string;
  logoUrl: string;
  whatsappUrl: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
  };
  copyrightText: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getAppUrl(): string {
  return trimTrailingSlash(
    Deno.env.get("APP_URL") ??
      Deno.env.get("EMAIL_WEBSITE_URL") ??
      "https://carry4me.uk",
  );
}

export function getEmailCompanyConfig(): EmailCompanyConfig {
  const websiteUrl = trimTrailingSlash(
    Deno.env.get("EMAIL_WEBSITE_URL") ?? getAppUrl(),
  );
  const logoUrl =
    Deno.env.get("EMAIL_LOGO_URL")?.trim() ||
    `${websiteUrl}/logo.svg`;
  const year = new Date().getFullYear();
  const companyName = Deno.env.get("EMAIL_COMPANY_NAME")?.trim() || "Carry4Me";

  const configuredPhone = Deno.env.get("EMAIL_PHONE")?.trim() || null;
  const normalizedConfiguredPhone = configuredPhone?.replace(/\s+/g, "") ?? null;
  const phone =
    !configuredPhone ||
      normalizedConfiguredPhone === "+31622528250" ||
      normalizedConfiguredPhone === "31622528250"
      ? "+44 7471366706"
      : configuredPhone;

  return {
    companyName,
    supportEmail:
      Deno.env.get("EMAIL_SUPPORT_EMAIL")?.trim() || "info@carry4me.uk",
    phone,
    address:
      Deno.env.get("EMAIL_ADDRESS")?.trim() ||
      "London, United Kingdom (Head office)",
    websiteUrl,
    logoUrl,
    whatsappUrl:
      Deno.env.get("EMAIL_WHATSAPP_URL")?.trim() || "https://wa.me/31622528250",
    social: {
      facebook: Deno.env.get("EMAIL_FACEBOOK_URL")?.trim() || null,
      instagram: Deno.env.get("EMAIL_INSTAGRAM_URL")?.trim() || null,
      twitter: Deno.env.get("EMAIL_TWITTER_URL")?.trim() || null,
    },
    copyrightText:
      Deno.env.get("EMAIL_COPYRIGHT")?.trim() ||
      `© ${year} ${companyName}. All rights reserved.`,
  };
}
