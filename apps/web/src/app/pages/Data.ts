import ParcelIcon from "@/assets/parcelIcon.svg?react";
import TravelIcon from "@/assets/travelerIcon.svg?react";
import Eye from "@/assets/eye.svg?react";
import Globe from "@/assets/globe.svg?react";
import Hands from "@/assets/hands.svg?react";
import Hand from "@/assets/hand.svg?react";
import User from "@/assets/userwithtick.svg?react";
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

export const safetyRules: InfoItem[] = [
  {
    Icon: Eye,
    label: "Inspection required",
    value: "Travelers only carry items they can inspect and confirm.",
  },
    {
    Icon: Hand,
    label: "No prohibited items",
    value: "Illegal drugs, weapons, cash, and hazardous goods are not allowed",
  },
  {
    Icon: User,
    label: "Choose your traveler",
    value:
      "Senders decide who carries their parcel and can reject at handover.",
  },

  {
    Icon: Hands,
    label: "Clear responsibility",
    value: "Both sender and traveler confirm handover.",
  },
];
