import ParcelIcon from "@/assets/parcelIcon.svg?react";
import TravelIcon from "@/assets/travelerIcon.svg?react";
import Globe from "@/assets/globe.svg?react";
import type { InfoItem } from "@/types/Ui";

export const steps = [
  {
    step: 1,
    title: "Post a parcel or a trip",
    description:
      "Senders list what they want to send.Travelers share their upcoming trips and available space.",
  },
  {
    step: 2,
    title: "Get matched",
    description:
      "Senders or travelers send a carry request based on listed details and price. Both sides confirm before proceeding",
  },

  {
    step: 3,
    title: "Secure payment",
    description:
      "If there is a match, the sender makes payment. We securely hold the payment until delivery is confirmed.",
  },

  {
    step: 4,
    title: "Deliver & Get Paid",
    description:
      "The traveler delivers the parcel.Payment is released after successful delivery.",
  },
];

export const stats: InfoItem[] = [
  {
    Icon: ParcelIcon,
    label: "Parcels sent",
    value: "+156",
  },
  {
    Icon: TravelIcon,
    label: "Travelers",
    value: "+56",
  },
  {
    Icon: Globe,
    label: "Countries",
    value: "1",
  },
];
