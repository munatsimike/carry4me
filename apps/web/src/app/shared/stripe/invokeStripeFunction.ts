import { supabase } from "@/app/shared/supabase/client";
import { AppError } from "@/app/shared/domain/AppError";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function parseEdgeFunctionErrorBody(
  data: unknown,
): { message: string | null; status: number | null; code: string | null } {
  if (!data || typeof data !== "object") {
    return { message: null, status: null, code: null };
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

  const code = typeof record.code === "string" ? record.code : null;

  return { message, status, code };
}

function parseStatusFromErrorMessage(message: string): number | null {
  const match = message.match(/\b(4\d{2}|5\d{2})\b/);
  return match ? Number(match[1]) : null;
}

async function getAccessTokenForEdgeFunction(): Promise<string> {
  let {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new AppError({
      message: "You must be signed in to continue.",
      status: 401,
      code: "NOT_AUTHENTICATED",
    });
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs - Date.now() < 60_000) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      session = refreshed.session;
    }
  }

  return session.access_token;
}

export async function invokeStripeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const accessToken = await getAccessTokenForEdgeFunction();

  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
  });

  if (error) {
    const raw = error.message ?? "Edge function request failed";
    const lower = raw.toLowerCase();
    const context = error as { context?: unknown };
    const response =
      typeof Response !== "undefined" && context.context instanceof Response
        ? context.context
        : null;

    const parsedDataError = parseEdgeFunctionErrorBody(data);
    let serverError: string | null = parsedDataError.message;
    let status = response?.status ?? parsedDataError.status;
    let code = parsedDataError.code;

    if (response) {
      try {
        const payload = (await response.clone().json()) as {
          error?: string;
          message?: string;
          code?: string;
        };
        serverError =
          payload?.error ?? payload?.message ?? serverError;
        code = payload?.code ?? code;
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

    throw new AppError({ message, status, code: code ?? undefined });
  }

  const dataError = parseEdgeFunctionErrorBody(data);
  if (dataError.message) {
    throw new AppError({
      message: dataError.message,
      status: dataError.status,
      code: dataError.code ?? undefined,
    });
  }

  return data as T;
}
