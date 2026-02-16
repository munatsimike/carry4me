// src/application/errors/types.ts
export type ErrorCategory =
  | "NETWORK"
  | "AUTH"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER"
  | "UNKNOWN";

export type ModalAction = "retry" | "login" | "close";

export interface NormalizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  action?: ModalAction;
}

// src/application/errors/supabase-error-mapper.ts

export function normalizeSupabaseError(
  error: any,
  status?: number | null,
): NormalizedError {
  // Network-ish
  if (!error || error?.message?.includes("Failed to fetch")) {
    return {
      category: "NETWORK",
      title: "Connection problem",
      message:
        "We couldn't reach the server. Check your internet connection and try again.",
      action: "retry",
    };
  }

  // HTTP first
  switch (status) {
    case 401:
      return {
        category: "AUTH",
        title: "Session expired",
        message: "Please sign in again.",
        action: "login",
      };
    case 403:
      return {
        category: "FORBIDDEN",
        title: "Access denied",
        message: "You don't have permission to do that.",
        action: "close",
      };
    case 404:
      return {
        category: "NOT_FOUND",
        title: "Not found",
        message: "We couldn't find what you were looking for.",
        action: "close",
      };
    case 429:
      return {
        category: "RATE_LIMIT",
        title: "Too many requests",
        message: "Please wait a moment and try again.",
        action: "retry",
      };
    case 400:
    case 422:
      return {
        category: "VALIDATION",
        title: "Invalid request",
        message: "Some information was invalid. Please try again.",
        action: "close",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        category: "SERVER",
        title: "Server error",
        message: "Something went wrong on our side. Please try again.",
        action: "retry",
      };
  }

  // Postgres codes (Supabase)
  switch (error?.code) {
    case "23505":
      return {
        category: "CONFLICT",
        title: "Already exists",
        message: "This record already exists.",
        action: "close",
      };
    case "23503":
      return {
        category: "VALIDATION",
        title: "Invalid reference",
        message: "This references data that doesn't exist.",
        action: "close",
      };
    case "23502":
      return {
        category: "VALIDATION",
        title: "Missing required field",
        message: "Some required information is missing.",
        action: "close",
      };
    case "42501":
      return {
        category: "FORBIDDEN",
        title: "Access denied",
        message: "You don't have permission to access this data.",
        action: "close",
      };
  }

  return {
    category: "UNKNOWN",
    title: "Unexpected error",
    message: "An unexpected error occurred. Please try again.",
    action: "retry",
  };
}
