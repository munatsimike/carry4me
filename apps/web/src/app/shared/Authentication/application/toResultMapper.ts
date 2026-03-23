import type { RepoResponse } from "../../domain/RepoResponse";
import type { Result } from "../domain/Result";

export function toResult<T>(res: RepoResponse<T>): Result<T> {
  if (res.error) return { success: false, error: res.error};
  if (res.data == null) return { success: false, error: { message: "No data returned", code: "NO_DATA" } };
  return { success: true, data: res.data };
}
