const CHANNEL_NAME = "carry4me:email-verify";

export type EmailVerifyTabMessage = {
  type: "EMAIL_VERIFIED";
};

function createEmailVerifyChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel(CHANNEL_NAME);
}

export function notifyEmailVerified(): void {
  const channel = createEmailVerifyChannel();
  if (!channel) return;

  channel.postMessage({ type: "EMAIL_VERIFIED" } satisfies EmailVerifyTabMessage);
  channel.close();
}

export function subscribeToEmailVerifiedEvents(
  onVerified: () => void,
): () => void {
  const channel = createEmailVerifyChannel();
  if (!channel) {
    return () => {};
  }

  const handler = (event: MessageEvent<EmailVerifyTabMessage>) => {
    if (event.data?.type === "EMAIL_VERIFIED") {
      onVerified();
    }
  };

  channel.onmessage = handler;

  return () => {
    channel.onmessage = null;
    channel.close();
  };
}
