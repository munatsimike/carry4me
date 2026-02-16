export type RepoResponse<T> = {
  data: T | null;
  error: any | null;
  status: number | null;
};
