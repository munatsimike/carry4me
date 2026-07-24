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

function sessionExpiredError(): AppError {
  return new AppError({
    message: "Your sign-in session expired. Sign in again, then retry payment.",
    status: 401,
    code: "SESSION_EXPIRED",
  });
}

async function getAccessTokenForEdgeFunction(
  options: { forceRefresh?: boolean } = {},
): Promise<string> {
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
  const expiresWithinOneMinute = expiresAtMs - Date.now() < 60_000;
  const isExpired = Date.now() >= expiresAtMs;

  if (options.forceRefresh || expiresWithinOneMinute || isExpired) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();

    if (!refreshError && refreshed.session?.access_token) {
      session = refreshed.session;
    } else if (isExpired || options.forceRefresh) {
      throw sessionExpiredError();
    }
  }

  return session.access_token;
}

function isUnauthorizedInvokeError(
  error: { message?: string; context?: unknown } | null,
  data: unknown,
  status: number | null,
): boolean {
  if (status === 401) return true;

  const parsed = parseEdgeFunctionErrorBody(data);
  if (parsed.status === 401) return true;

  const message = `${error?.message ?? ""} ${parsed.message ?? ""}`.toLowerCase();
  return message.includes("unauthorized") || message.includes("401");
}

async function invokeStripeFunctionOnce<T>(
  name: string,
  body: Record<string, unknown>,
  accessToken: string,
): Promise<{ data: T | null; error: { message?: string; context?: unknown } | null }> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
  });

  return { data, error };
}

async function throwInvokeStripeFunctionError<T>(
  name: string,
  data: T | null,
  error: { message?: string; context?: unknown } | null,
): Promise<never> {
  const raw = error?.message ?? "Edge function request failed";
  const lower = raw.toLowerCase();
  const context = error as { context?: unknown } | null;
  const response =
    typeof Response !== "undefined" && context?.context instanceof Response
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
        reason?: string;
      };
      serverError =
        payload?.error ??
        payload?.message ??
        (payload?.reason ? `Request failed: ${payload.reason}` : null) ??
        serverError;
      code = payload?.code ?? payload?.reason ?? code;
    } catch {
      // Response body may be empty or non-JSON.
    }
    status = status ?? response.status;
  }

  status = status ?? parseStatusFromErrorMessage(raw);

  if (status === 401) {
    throw sessionExpiredError();
  }

  const message = serverError
    ? serverError
    : lower.includes("404") || lower.includes("not found")
      ? `Edge function "${name}" returned 404. Verify "${name}" is deployed and that the carry request id/status is valid (PENDING_PAYMENT, sender-owned).`
      : raw.includes("Failed to send a request to the Edge Function")
        ? `Could not reach "${name}". Make sure your edge functions are deployed and CORS is configured.`
        : raw;

  throw new AppError({
    message: code ? `${message} (${code})` : message,
    status,
    code: code ?? undefined,
  });
}

export async function invokeStripeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  let accessToken = await getAccessTokenForEdgeFunction();
  let { data, error } = await invokeStripeFunctionOnce<T>(name, body, accessToken);

  if (error) {
    const parsedDataError = parseEdgeFunctionErrorBody(data);
    const context = error as { context?: unknown };
    const response =
      typeof Response !== "undefined" && context.context instanceof Response
        ? context.context
        : null;
    const status = response?.status ?? parsedDataError.status;

    if (isUnauthorizedInvokeError(error, data, status)) {
      accessToken = await getAccessTokenForEdgeFunction({ forceRefresh: true });
      ({ data, error } = await invokeStripeFunctionOnce<T>(name, body, accessToken));
    }
  }

  if (error) {
    await throwInvokeStripeFunctionError(name, data, error);
  }

  // Domain responses like { ok: false, message } must be returned to the caller.
  if (data && typeof data === "object" && "ok" in (data as object)) {
    return data as T;
  }

  const dataError = parseEdgeFunctionErrorBody(data);
  if (dataError.message) {
    if (dataError.status === 401) {
      throw sessionExpiredError();
    }

    throw new AppError({
      message: dataError.message,
      status: dataError.status,
      code: dataError.code ?? undefined,
    });
  }

  return data as T;
}
