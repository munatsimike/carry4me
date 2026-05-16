export type AppErrorShape = {
  code?: string;
  message: string;
  status?: number | null;
};

export class AppError extends Error {
  code?: string;
  status?: number | null;

  constructor(error: AppErrorShape) {
    super(error.message);
    this.name = "AppError";
    this.code = error.code;
    this.status = error.status ?? null;
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) {
      const withCode = error as Error & { code?: string; status?: number | null };
      return new AppError({
        message: error.message,
        code: withCode.code,
        status: withCode.status ?? null,
      });
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      const e = error as AppErrorShape;
      return new AppError({
        message: String(e.message),
        code: e.code,
        status: e.status ?? null,
      });
    }
    return new AppError({ message: String(error ?? "Unknown error") });
  }
}

export function throwIfSupabaseError(
  error: { message: string; code?: string } | null,
  status?: number | null,
): asserts error is null {
  if (error) {
    throw new AppError({
      message: error.message,
      code: error.code,
      status: status ?? null,
    });
  }
}

export function requireData<T>(
  data: T | null | undefined,
  message = "No data returned",
  code = "NO_DATA",
): T {
  if (data == null) {
    throw new AppError({ message, code });
  }
  return data;
}
