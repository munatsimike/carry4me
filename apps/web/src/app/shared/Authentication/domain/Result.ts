
export type Result<T, E = unknown> =
  | { success: true; data: T }
  | { success: false; error: E; status?: number | null };
