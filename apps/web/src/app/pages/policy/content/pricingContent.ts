import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const pricingContent: PolicyPageContent = {
  title: "Pricing",
  description:
    "How prices are set on Carry4Me, which rate applies when you match, and how the platform service fee is calculated.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "set-your-price",
      title: "Senders and travelers set their own price",
      paragraphs: [
        "When you post a parcel or a trip, you choose your own price per kilogram. There is no fixed platform rate—each listing reflects what that sender or traveler is willing to pay or charge.",
      ],
      bullets: [
        "Senders set a price per kg on their parcel listing.",
        "Travelers set a price per kg on their trip listing.",
        "You always see the total delivery cost before sending or accepting a request.",
      ],
    },
    {
      id: "who-can-start",
      title: "Either side can start a request",
      paragraphs: [
        "Senders can browse trips and send a carry request. Travelers can browse parcels and send an offer. Either party can be the initiator.",
      ],
    },
    {
      id: "recipient-price",
      title: "The recipient’s price is used",
      paragraphs: [
        "When a carry request is created, the price per kg from the person who receives the request is the one that applies to the booking.",
      ],
      bullets: [
        "Sender initiates → the traveler’s trip price per kg is used.",
        "Traveler initiates → the sender’s parcel price per kg is used.",
        "Total delivery cost = price per kg × parcel weight.",
      ],
    },
    {
      id: "service-fee",
      title: "Platform service fee (20%)",
      paragraphs: [
        "Carry4Me charges a service fee of 20% on the delivery subtotal (price per kg × weight). This fee is shown in the cost summary before you pay.",
      ],
      bullets: [
        "Delivery subtotal = recipient’s price per kg × parcel weight.",
        "Service fee = 20% of the delivery subtotal.",
        "Amount due at checkout = delivery subtotal + service fee.",
      ],
    },
    {
      id: "example",
      title: "Example",
      paragraphs: [
        "A sender posts a parcel weighing 5 kg at $12 per kg. A traveler initiates a request using that parcel listing. Delivery subtotal: 5 × $12 = $60. Service fee (20%): $12. Total the sender pays: $72.",
        "If the sender had initiated instead, the traveler’s trip price per kg would be used for the same calculation.",
      ],
    },
    {
      id: "payments",
      title: "When you pay",
      paragraphs: [
        "Payment is collected through the platform after a request is accepted. Funds are held securely until delivery is confirmed. See our Refund Policy for cancellations and disputes.",
      ],
    },
  ],
};
