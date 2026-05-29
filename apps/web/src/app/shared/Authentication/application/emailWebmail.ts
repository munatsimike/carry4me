export type WebmailAction = {
  label: string;
  url: string;
};

const WEBMAIL_BY_DOMAIN: Record<string, WebmailAction> = {
  "gmail.com": { label: "Open Gmail", url: "https://mail.google.com" },
  "googlemail.com": { label: "Open Gmail", url: "https://mail.google.com" },
  "yahoo.com": { label: "Open Yahoo Mail", url: "https://mail.yahoo.com" },
  "yahoo.co.uk": { label: "Open Yahoo Mail", url: "https://mail.yahoo.com" },
  "ymail.com": { label: "Open Yahoo Mail", url: "https://mail.yahoo.com" },
  "outlook.com": { label: "Open Outlook", url: "https://outlook.live.com/mail/" },
  "hotmail.com": { label: "Open Outlook", url: "https://outlook.live.com/mail/" },
  "live.com": { label: "Open Outlook", url: "https://outlook.live.com/mail/" },
  "msn.com": { label: "Open Outlook", url: "https://outlook.live.com/mail/" },
  "icloud.com": { label: "Open iCloud Mail", url: "https://www.icloud.com/mail" },
  "me.com": { label: "Open iCloud Mail", url: "https://www.icloud.com/mail" },
  "mac.com": { label: "Open iCloud Mail", url: "https://www.icloud.com/mail" },
  "proton.me": { label: "Open Proton Mail", url: "https://mail.proton.me" },
  "protonmail.com": { label: "Open Proton Mail", url: "https://mail.proton.me" },
  "aol.com": { label: "Open AOL Mail", url: "https://mail.aol.com" },
};

export function getWebmailAction(email: string): WebmailAction | null {
  const domain = email.trim().split("@")[1]?.toLowerCase();
  if (!domain) return null;
  return WEBMAIL_BY_DOMAIN[domain] ?? null;
}
