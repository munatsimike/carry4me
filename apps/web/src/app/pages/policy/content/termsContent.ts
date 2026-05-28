import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const termsContent: PolicyPageContent = {
  title: "Terms & Conditions",
  description:
    "These terms govern your use of Carry4Me. By creating an account or using the platform, you agree to the rules below.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      paragraphs: [
        "Carry4Me is a marketplace that connects senders with travelers for peer-to-peer delivery. We facilitate listings, requests, payments, and delivery confirmation—we are not a courier or shipping carrier.",
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility",
      bullets: [
        "You must be at least 18 years old and able to enter a binding agreement.",
        "You must provide accurate registration and profile information.",
        "Accounts may require phone, email, or identity verification.",
      ],
    },
    {
      id: "accounts",
      title: "User Accounts",
      bullets: [
        "You are responsible for activity on your account and keeping credentials secure.",
        "One person may not maintain multiple accounts to evade restrictions.",
        "We may suspend accounts that violate these terms or applicable law.",
      ],
    },
    {
      id: "senders",
      title: "Sender Responsibilities",
      bullets: [
        "List only legal goods and provide truthful descriptions.",
        "Pack items safely and comply with customs and import rules.",
        "Pay through the platform for accepted bookings.",
        "Cooperate with inspection before handover when requested.",
      ],
    },
    {
      id: "travelers",
      title: "Traveler Responsibilities",
      bullets: [
        "Carry only items you are legally allowed to transport.",
        "Inspect packages before acceptance and refuse prohibited or unsafe items.",
        "Honor agreed routes, dates, and communication standards.",
        "Complete delivery verification when required.",
      ],
    },
    {
      id: "inspection-handover",
      title: "Package Inspection & Handover",
      paragraphs: [
        "Travelers may inspect packages before acceptance. Either party may reject a parcel before handover if contents appear unsafe, illegal, or inconsistent with the listing.",
      ],
    },
    {
      id: "payments",
      title: "Payments & Escrow",
      bullets: [
        "Payments are processed through approved payment partners.",
        "Funds are held securely until delivery is confirmed according to platform rules.",
        "Off-platform payments are not permitted and may void protections.",
      ],
    },
    {
      id: "delivery",
      title: "Delivery Verification",
      paragraphs: [
        "Delivery may require OTP or other in-app confirmation. Both parties must cooperate to complete verification accurately.",
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation Policy",
      paragraphs: [
        "Cancellation rights depend on booking status. See our Refund Policy for details before and after acceptance or handover.",
      ],
    },
    {
      id: "disputes",
      title: "Disputes & Refunds",
      paragraphs: [
        "Disputes are reviewed case by case. Carry4Me may request evidence and may adjust payments according to our Refund Policy.",
      ],
    },
    {
      id: "suspension",
      title: "Account Suspension",
      paragraphs: [
        "We may suspend or terminate accounts for fraud, prohibited items, abuse, or repeated violations.",
      ],
    },
    {
      id: "liability",
      title: "Liability Limitations",
      paragraphs: [
        "Carry4Me is provided “as is.” To the extent permitted by law, we are not liable for indirect damages, and our liability is limited to fees paid for the affected booking, except where law requires otherwise.",
      ],
    },
  ],
};
