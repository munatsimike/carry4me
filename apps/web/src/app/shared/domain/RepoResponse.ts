export type RepoResponse<T> = {
  data: T | null;
  error: unknown | null;
  status: number | null;
};
