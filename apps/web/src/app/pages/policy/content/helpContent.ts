import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const helpContent: PolicyPageContent = {
  title: "Help Center",
  description:
    "Answers to common questions about accounts, bookings, payments, and delivery on Carry4Me.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "account",
      title: "Account Help",
      bullets: [
        "Complete your profile with a verified phone number to post listings and send requests.",
        "Update your details from Profile in the app menu.",
        "If you cannot sign in, use the phone verification flow or contact support.",
      ],
    },
    {
      id: "booking",
      title: "Booking Help",
      bullets: [
        "Senders post parcels; travelers post trips. Match by route, date, and capacity.",
        "Send a carry request from a listing, then wait for the other party to accept.",
        "Check Requests for status updates on pending and active bookings.",
      ],
    },
    {
      id: "payments",
      title: "Payment Questions",
      bullets: [
        "Pay through the platform after a request is accepted, when prompted.",
        "Payments are held securely until delivery is confirmed.",
        "Travelers may need to complete payout onboarding to receive funds.",
        "See the Pricing page for how per-kg rates, the 20% service fee, and recipient pricing work.",
      ],
    },
    {
      id: "pricing",
      title: "Pricing model",
      paragraphs: [
        "Senders and travelers set their own price per kg on listings. Either party can initiate a carry request. The price from the person who receives the request is used (sender initiates → traveler’s rate; traveler initiates → sender’s rate).",
        "Total delivery = price per kg × parcel weight. Carry4Me charges a 20% service fee on that delivery amount. The full breakdown is shown before payment.",
      ],
    },
    {
      id: "delivery",
      title: "Delivery Questions",
      bullets: [
        "Coordinate meetup location and time through in-app messaging.",
        "Complete OTP or in-app delivery confirmation when required.",
        "Report problems immediately if handover or delivery cannot be completed.",
      ],
    },
    {
      id: "disputes",
      title: "Disputes",
      paragraphs: [
        "If something goes wrong, contact support with your booking ID, photos, and a short description. See our Refund Policy for cancellation and refund rules.",
      ],
    },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      paragraphs: [
        "How do I send a parcel? Log in, post your parcel details, browse available travelers, and send a carry request. Once accepted, make payment and hand over the parcel.",
        "How do I post a trip? Log in, post your trip details: departure city, destination, travel date, available luggage space, and carrying price. Once your trip is published, senders can find your trip and send you parcel requests.",
        "Can travelers inspect packages? Yes. Travelers may inspect packages before acceptance, and either party may refuse handover if something seems unsafe or misdescribed.",
        "When is payment released? After successful delivery confirmation, unless a dispute is under review.",
        "What happens if delivery fails? The booking may be cancelled or refunded after review. Document the issue in the app.",
        "Can I cancel after handover? Generally no, except for disputes or emergencies reviewed by support.",
        "What items are prohibited? See our Prohibited Items page. Only legal goods are allowed.",
      ],
    },
    {
      id: "contact",
      title: "Contact Support",
      paragraphs: [
        "Email info@carry4me.uk or use WhatsApp from the site footer. Include your account email and booking ID for faster help.",
      ],
    },
  ],
};
