const STORAGE_PREFIX = "carry4me.passkeyPrompt.dismissed";

export function isPasskeyPromptDismissed(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${STORAGE_PREFIX}.${userId}`) === "1";
}

export function setPasskeyPromptDismissed(userId: string, dismissed: boolean) {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_PREFIX}.${userId}`;
  if (dismissed) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
}
