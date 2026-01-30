export function isNetworkError(e: unknown): boolean {
  const msg = String((e as any)?.message ?? e);
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("AuthRetryableFetchError")
  );
}
