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
        "Carry4Me is a marketplace that connects senders with travelers for peer-to-peer delivery. By using the platform, you agree to these Terms & Conditions.",
      ],
    },
    {
      id: "carry4me-role",
      title: "Carry4Me's role",
      paragraphs: [
        "Carry4Me provides the marketplace and tools that help senders and travelers connect. We are not the carrier of the goods.",
      ],
      bullets: [
        "We provide the marketplace where senders and travelers list parcels and trips.",
        "We facilitate payments through approved payment partners.",
        "We verify users where possible, such as through phone, email, or identity checks.",
        "We help resolve disputes according to our policies, but we do not take physical custody of parcels.",
        "Travelers and senders—not Carry4Me—are responsible for handover, transport, and delivery of items.",
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
      id: "traveler-responsibility",
      title: "Traveler responsibility",
      paragraphs: [
        "When a traveler accepts a parcel, they agree that they are responsible for it from the time they receive it until it is delivered.",
        "This responsibility applies throughout the carry, including after handover is confirmed in the app.",
      ],
      bullets: [
        "Loss of the parcel while in the traveler's care.",
        "Theft of the parcel while in the traveler's care.",
        "Damage caused by the traveler's negligence.",
        "Failure to deliver without a valid reason.",
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
        "Carry4Me is provided “as is.” We are a marketplace facilitator, not a carrier, courier, or insurer of goods.",
        "To the extent permitted by law, we are not liable for loss, theft, or damage to parcels while they are in a traveler's care, and we are not liable for indirect damages.",
        "Our liability is limited to fees paid for the affected booking, except where law requires otherwise.",
      ],
    },
  ],
};
