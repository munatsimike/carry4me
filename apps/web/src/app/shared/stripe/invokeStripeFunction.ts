import { supabase } from "@/app/shared/supabase/client";
import { AppError } from "@/app/shared/domain/AppError";

function parseEdgeFunctionErrorBody(
  data: unknown,
): { message: string | null; status: number | null } {
  if (!data || typeof data !== "object") {
    return { message: null, status: null };
  }

  const record = data as Record<string, unknown>;
  const message =
    typeof record.error === "string"
      ? record.error
      : typeof record.message === "string"
        ? record.message
        : null;

  const status =
    typeof record.status === "number"
      ? record.status
      : typeof record.statusCode === "number"
        ? record.statusCode
        : null;

  return { message, status };
}

function parseStatusFromErrorMessage(message: string): number | null {
  const match = message.match(/\b(4\d{2}|5\d{2})\b/);
  return match ? Number(match[1]) : null;
}

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

    let serverError: string | null = parseEdgeFunctionErrorBody(data).message;
    let status = response?.status ?? parseEdgeFunctionErrorBody(data).status;

    if (response) {
      try {
        const payload = (await response.clone().json()) as {
          error?: string;
          message?: string;
        };
        serverError =
          payload?.error ?? payload?.message ?? serverError;
      } catch {
        // Response body may be empty or non-JSON.
      }
      status = status ?? response.status;
    }

    status = status ?? parseStatusFromErrorMessage(raw);

    const message = serverError
      ? serverError
      : lower.includes("404") || lower.includes("not found")
        ? `Edge function "${name}" returned 404. Verify "${name}" is deployed and that the carry request id/status is valid (PENDING_PAYMENT, sender-owned).`
        : raw.includes("Failed to send a request to the Edge Function")
          ? `Could not reach "${name}". Make sure your edge functions are deployed and CORS is configured.`
          : raw;

    throw new AppError({ message, status });
  }

  const dataError = parseEdgeFunctionErrorBody(data);
  if (dataError.message) {
    throw new AppError({
      message: dataError.message,
      status: dataError.status,
    });
  }

  return data as T;
}
