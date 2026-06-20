const CHANNEL_NAME = "carry4me:email-verify";
const TAB_ID_KEY = "carry4me:tabId";
const TAB_INIT_KEY = "carry4me:tabInitAt";
const MIN_ESTABLISHED_TAB_AGE_MS = 1500;
export const EMAIL_VERIFY_HANDOFF_WAIT_MS = 500;

export type EmailVerifyTabMessage =
  | {
      type: "VERIFY_EMAIL_REQUEST";
      requestId: string;
      token: string;
      path: string;
    }
  | {
      type: "VERIFY_EMAIL_CLAIMED";
      requestId: string;
      tabId: string;
    };

export function getOrCreateTabId(): string {
  let id = sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
}

export function markTabInitialized(): void {
  if (!sessionStorage.getItem(TAB_INIT_KEY)) {
    sessionStorage.setItem(TAB_INIT_KEY, String(Date.now()));
  }
}

export function getTabAgeMs(): number {
  const initAt = Number(sessionStorage.getItem(TAB_INIT_KEY) || Date.now());
  return Date.now() - initAt;
}

export function isEstablishedAppTab(): boolean {
  return getTabAgeMs() >= MIN_ESTABLISHED_TAB_AGE_MS;
}

function createEmailVerifyChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel(CHANNEL_NAME);
}

function claimStorageKey(requestId: string): string {
  return `carry4me:verify-claim:${requestId}`;
}

function tryClaimVerificationRequest(
  requestId: string,
  tabId: string,
): boolean {
  const key = claimStorageKey(requestId);
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing === tabId;
  }
  localStorage.setItem(key, tabId);
  window.setTimeout(() => localStorage.removeItem(key), 10_000);
  return true;
}

export function requestEmailVerificationHandoff(
  token: string,
): Promise<"self" | "other-tab"> {
  return new Promise((resolve) => {
    const trimmed = token.trim();
    if (!trimmed) {
      resolve("self");
      return;
    }

    const channel = createEmailVerifyChannel();
    if (!channel) {
      resolve("self");
      return;
    }

    const tabId = getOrCreateTabId();
    const requestId = crypto.randomUUID();
    const path = `/verify-email?token=${encodeURIComponent(trimmed)}`;
    let settled = false;

    const finish = (result: "self" | "other-tab") => {
      if (settled) return;
      settled = true;
      channel.onmessage = null;
      channel.close();
      resolve(result);
    };

    channel.onmessage = (event: MessageEvent<EmailVerifyTabMessage>) => {
      const data = event.data;
      if (
        data?.type === "VERIFY_EMAIL_CLAIMED" &&
        data.requestId === requestId &&
        data.tabId !== tabId
      ) {
        finish("other-tab");
      }
    };

    channel.postMessage({
      type: "VERIFY_EMAIL_REQUEST",
      requestId,
      token: trimmed,
      path,
    });

    window.setTimeout(() => finish("self"), EMAIL_VERIFY_HANDOFF_WAIT_MS);
  });
}

export function subscribeToEmailVerificationRequests(
  onRequest: (message: Extract<
    EmailVerifyTabMessage,
    { type: "VERIFY_EMAIL_REQUEST" }
  >) => void,
): () => void {
  markTabInitialized();

  const channel = createEmailVerifyChannel();
  if (!channel) {
    return () => {};
  }

  const handler = (event: MessageEvent<EmailVerifyTabMessage>) => {
    const data = event.data;
    if (data?.type !== "VERIFY_EMAIL_REQUEST") return;
    if (!isEstablishedAppTab()) return;

    const tabId = getOrCreateTabId();
    if (!tryClaimVerificationRequest(data.requestId, tabId)) return;

    channel.postMessage({
      type: "VERIFY_EMAIL_CLAIMED",
      requestId: data.requestId,
      tabId,
    });

    onRequest(data);
  };

  channel.onmessage = handler;

  return () => {
    channel.onmessage = null;
    channel.close();
  };
}
