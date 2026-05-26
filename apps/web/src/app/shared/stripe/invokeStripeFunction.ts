import { supabase } from "@/app/shared/supabase/client";
import { AppError } from "@/app/shared/domain/AppError";

export async function invokeStripeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
    method: "POST",
  });

  if (error) {
    const raw = error.message ?? "Edge function request failed";
    const lower = raw.toLowerCase();
    const context = error as { context?: unknown };
    const response =
      typeof Response !== "undefined" && context.context instanceof Response
        ? context.context
        : null;

    let serverError: string | null = null;
    const status = response?.status ?? null;
    if (response) {
      try {
        const payload = (await response.clone().json()) as { error?: string };
        if (payload?.error) {
          serverError = payload.error;
        }
      } catch {
        // Response body may be empty or non-JSON.
      }
    }

    const message = serverError
      ? serverError
      : lower.includes("404") || lower.includes("not found")
        ? `Edge function "${name}" returned 404. Verify "${name}" is deployed and that the carry request id/status is valid (PENDING_PAYMENT, sender-owned).`
        : raw.includes("Failed to send a request to the Edge Function")
          ? `Could not reach "${name}". Make sure your Stripe edge functions are deployed and CORS is configured.`
          : raw;

    throw new AppError({ message, status });
  }

  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error?: string }).error;
    if (err) {
      throw new AppError({ message: err });
    }
  }

  return data as T;
}
