import type { AppError } from "../../domain/RepoResponse";

export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E; status?: number | null };
