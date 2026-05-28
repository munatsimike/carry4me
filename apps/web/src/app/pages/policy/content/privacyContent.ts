import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const privacyContent: PolicyPageContent = {
  title: "Privacy Policy",
  description:
    "This policy explains what information we collect, how we use it, and the choices you have.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "collected",
      title: "Information Collected",
      bullets: [
        "Account details such as name, email, and phone number.",
        "Profile information including country, city, and optional photo.",
        "Listing, booking, and messaging activity on the platform.",
        "Device and usage data needed to operate and secure the service.",
      ],
    },
    {
      id: "verification",
      title: "Phone & Email Verification",
      paragraphs: [
        "We use phone and email verification to secure accounts and reduce fraud. Verified contact details may be used for login, notifications, and account recovery.",
      ],
    },
    {
      id: "payments",
      title: "Payment Information",
      paragraphs: [
        "Payment card and payout details are processed by our payment partners. Carry4Me does not store full card numbers on our servers.",
      ],
    },
    {
      id: "identity",
      title: "Identity Verification",
      paragraphs: [
        "We may collect additional verification data when required for compliance, fraud prevention, or account review. This may include government ID or business details where applicable.",
      ],
    },
    {
      id: "security",
      title: "Data Security",
      bullets: [
        "We use technical and organizational measures to protect personal data.",
        "Access is limited to personnel and systems with a legitimate need.",
        "No method of transmission over the internet is 100% secure.",
      ],
    },
    {
      id: "fraud",
      title: "Fraud Prevention",
      paragraphs: [
        "We analyze account and transaction signals to detect abuse. Phone numbers may be shared between matched parties after an accepted booking to coordinate handover.",
      ],
    },
    {
      id: "rights",
      title: "User Rights",
      bullets: [
        "You may request access, correction, or deletion of personal data where applicable law allows.",
        "You may update profile details in account settings.",
        "Contact support for privacy-related requests.",
      ],
    },
  ],
};
