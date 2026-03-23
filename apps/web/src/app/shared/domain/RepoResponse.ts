

export type AppError = {
  code?: string;
  message: string;
  status?: number |null;
};
export type RepoResponse<T> = {
  data: T | null;
  error: AppError | null;
};
