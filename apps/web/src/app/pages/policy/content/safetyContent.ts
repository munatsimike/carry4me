import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const safetyContent: PolicyPageContent = {
  title: "Safety Center",
  description:
    "Practical guidance for senders and travelers using Carry4Me. Follow these tips to protect yourself, your packages, and the community.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "sender-tips",
      title: "Safety Tips for Senders",
      bullets: [
        "Describe parcel contents accurately and honestly.",
        "Pack items securely to prevent damage in transit.",
        "Confirm the traveler’s profile and trip details before handover.",
        "Never send illegal, dangerous, or prohibited items.",
      ],
    },
    {
      id: "traveler-tips",
      title: "Safety Tips for Travelers",
      bullets: [
        "Inspect packages before you accept or carry them.",
        "Decline any parcel that seems unsafe, tampered with, or misdescribed.",
        "Keep receipts and trip details available if questions arise.",
        "Do not carry items you cannot legally transport.",
        "Report suspicious senders or parcels immediately.",
      ],
    },
    {
      id: "traveler-custody",
      title: "Your responsibility after acceptance",
      paragraphs: [
        "When you accept a carry request and receive a parcel, you are responsible for it until delivery is completed.",
      ],
      bullets: [
        "Take reasonable care to prevent loss, theft, or damage while the parcel is with you.",
        "Deliver the parcel as agreed, or communicate promptly if something prevents delivery.",
        "Use in-app handover and delivery confirmation so there is a clear record.",
        "See our Terms & Conditions for full details on traveler responsibility and Carry4Me's role.",
      ],
    },
    {
      id: "meetup",
      title: "Safe Meetup Guidelines",
      bullets: [
        "Choose a handover location that works for both parties, such as a workplace, residence, transport hub, or public meeting point.",
        "Verify the other party’s identity matches their Carry4Me profile.",
        "Complete handover only after both sides agree the parcel matches the listing.",
      ],
    },
    {
      id: "inspection",
      title: "Package Inspection Guidance",
      paragraphs: [
        "Travelers may inspect packages before acceptance. Senders should expect a reasonable check of packaging, weight, and declared contents.",
      ],
      bullets: [
        "Travelers may open outer packaging to verify contents when needed.",
        "Either party may refuse handover before acceptance if something seems wrong.",
        "Do not pressure someone to accept a parcel they are uncomfortable carrying.",
        "Document issues in the app and contact support if a dispute arises.",
      ],
    },
    {
      id: "scams",
      title: "Scam Prevention Tips",
      bullets: [
        "Use platform payments only—never send money outside Carry4Me.",
        "Be wary of urgent requests, unusually high payouts, or off-platform contact.",
        "Do not share passwords, OTP codes, or payment details with other users.",
        "Verify booking details inside the app before meeting.",
        "Report suspicious behavior through Help Center or support channels.",
      ],
    },
  ],
};
