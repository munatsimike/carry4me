import type { PolicyPageContent } from "../types";

export const aboutContent: PolicyPageContent = {
  title: "About Carry4Me",
  description:
    "Carry4Me connects people who need to send parcels with travelers who have spare luggage space—making cross-border delivery more affordable, personal, and community-driven.",
  imageSrc: "/images/about-image.png",
  sections: [
    {
      id: "mission",
      title: "Our mission",
      paragraphs: [
        "We believe sending items to family and friends abroad should not depend only on expensive traditional couriers. Carry4Me helps senders and travelers find each other on shared routes, agree on a fair price, and complete delivery with platform safeguards.",
      ],
    },
    {
      id: "what-we-do",
      title: "What we do",
      paragraphs: [
        "Carry4Me is a marketplace—not a shipping company or carrier of goods. We provide listings, matching, secure payments, delivery confirmation tools, and dispute support where possible. Senders post parcels; travelers post trips; either side can start a carry request when routes align.",
      ],
      bullets: [
        "Senders list parcel details, weight, and their price per kg.",
        "Travelers list trip routes, dates, capacity, and their price per kg.",
        "Both sides review and confirm before handover and payment.",
      ],
    },
    {
      id: "community",
      title: "Community-powered delivery",
      paragraphs: [
        "Many of our users are helping loved ones receive clothes, documents, gifts, and essentials. Travelers can offset trip costs by carrying items they are comfortable transporting. Every booking is a direct connection between real people.",
      ],
    },
    {
      id: "where",
      title: "Where we operate",
      paragraphs: [
        "Carry4Me is growing across routes between the United Kingdom, United States, Zimbabwe, and surrounding regions. We continue to expand corridors based on community demand and compliance requirements.",
      ],
    },
  ],
};
