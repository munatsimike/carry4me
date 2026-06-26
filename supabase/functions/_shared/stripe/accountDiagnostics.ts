export type StripeAccountDebugSummary = {
  id: string | null;
  country: string | null;
  default_currency: string | null;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
  type: string | null;
  business_profile_url: string | null;
  capabilities: Record<string, string> | null;
};

export type StripeKeyDebugSummary = {
  secret_key_prefix: string;
  secret_key_livemode: boolean;
};

export function stripeKeyDebugSummary(secretKey: string): StripeKeyDebugSummary {
  const trimmed = secretKey.trim();
  return {
    secret_key_prefix: trimmed ? `${trimmed.slice(0, 12)}…` : "missing",
    secret_key_livemode: trimmed.startsWith("sk_live_"),
  };
}

export async function fetchStripeAccountDebugSummary(
  secretKey: string,
): Promise<StripeAccountDebugSummary | null> {
  try {
    const response = await fetch("https://api.stripe.com/v1/account", {
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
      },
    });

    if (!response.ok) {
      console.warn(
        "fetchStripeAccountDebugSummary failed",
        response.status,
        await response.text(),
      );
      return null;
    }

    const account = (await response.json()) as {
      id?: string;
      country?: string;
      default_currency?: string;
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      type?: string;
      business_profile?: { url?: string | null };
      capabilities?: Record<string, string>;
    };

    return {
      id: account.id ?? null,
      country: account.country ?? null,
      default_currency: account.default_currency ?? null,
      charges_enabled: account.charges_enabled ?? null,
      payouts_enabled: account.payouts_enabled ?? null,
      type: account.type ?? null,
      business_profile_url: account.business_profile?.url ?? null,
      capabilities: account.capabilities ?? null,
    };
  } catch (err) {
    console.warn(
      "fetchStripeAccountDebugSummary failed",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function fetchPaymentMethodConfigurationSummary(
  secretKey: string,
): Promise<unknown> {
  try {
    const response = await fetch(
      "https://api.stripe.com/v1/payment_method_configurations?limit=5",
      {
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
        },
      },
    );

    if (!response.ok) {
      console.warn(
        "fetchPaymentMethodConfigurationSummary failed",
        response.status,
        await response.text(),
      );
      return null;
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id: string;
        active?: boolean;
        name?: string;
        google_pay?: { available?: boolean; display_preference?: unknown };
        apple_pay?: { available?: boolean; display_preference?: unknown };
        link?: { available?: boolean; display_preference?: unknown };
        card?: { available?: boolean; display_preference?: unknown };
      }>;
    };

    return (payload.data ?? []).map((config) => ({
      id: config.id,
      active: config.active,
      name: config.name,
      google_pay: config.google_pay,
      apple_pay: config.apple_pay,
      link: config.link,
      card: config.card,
    }));
  } catch (err) {
    console.warn(
      "fetchPaymentMethodConfigurationSummary failed",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
