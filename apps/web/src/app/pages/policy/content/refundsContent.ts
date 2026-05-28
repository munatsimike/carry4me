import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const refundsContent: PolicyPageContent = {
  title: "Refund Policy",
  description:
    "How cancellations, refunds, and payment release work on Carry4Me.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "before-acceptance",
      title: "Before Acceptance",
      paragraphs: [
        "Either party may cancel before a carry request is accepted. Payments that have not been captured for an active booking are typically not charged, or may be released according to payment partner rules.",
      ],
    },
    {
      id: "after-acceptance",
      title: "After Acceptance",
      bullets: [
        "Cancellations after acceptance may be subject to review.",
        "Repeated cancellations may affect account standing.",
        "Refunds depend on whether handover has occurred and the reason for cancellation.",
      ],
    },
    {
      id: "after-handover",
      title: "After Handover",
      paragraphs: [
        "Once a parcel has been handed to the traveler, cancellation is generally not available except for disputes, emergencies, or platform-directed resolutions.",
      ],
    },
    {
      id: "failed-delivery",
      title: "Failed Deliveries",
      paragraphs: [
        "If delivery cannot be completed, parties should document the issue in the app. Carry4Me may review evidence and determine partial or full refunds case by case.",
      ],
    },
    {
      id: "disputes",
      title: "Disputes",
      bullets: [
        "Open a dispute through Help Center or support with booking details.",
        "Provide photos, messages, and timestamps when available.",
        "Decisions are made based on platform records and applicable policy.",
      ],
    },
    {
      id: "processing",
      title: "Refund Processing",
      paragraphs: [
        "Approved refunds are returned to the original payment method when possible. Processing times depend on banks and payment partners and may take several business days.",
        "Payments are held securely until delivery confirmation. Release to travelers occurs after successful verification unless a dispute is open.",
      ],
    },
  ],
};
