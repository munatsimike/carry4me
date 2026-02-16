
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: any; status?: number | null };

