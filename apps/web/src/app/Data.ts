import ParcelIcon from "@/assets/parcelIcon.svg?react";
import TravelIcon from "@/assets/travelerIcon.svg?react";
import Eye from "@/assets/eye.svg?react";
import Globe from "@/assets/globe.svg?react";
import Hands from "@/assets/hands.svg?react";
import Hand from "@/assets/hand.svg?react";
import Wallet from "@/assets/wallet.svg?react";
import Rocket from "@/assets/rocket.svg?react";
import Money from "@/assets/money.svg?react";
import Plane from "@/assets/plane-filled.svg?react";
import LoveHands from "@/assets/lovehands.svg?react";
import User from "@/assets/userwithtick.svg?react";
import Lock from "@/assets/lock.svg?react";
import type { CarryRequest, InfoItem, Parcel, Trip } from "@/types/Ui";

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

export const benefits: InfoItem[] = [
  {
    Icon: Wallet,
    label: "Save Money",
    value:
      "Much cheaper than traditional shipping. You negotiate the delivery fee.",
    tag: "sender",
  },
  {
    Icon: Plane,
    label: "Travel for free or less ",
    value: "Parcels you carry can help lower your travel expenses.",
    tag: "traveler",
  },
  {
    Icon: Lock,
    label: "Pay After Delivery",
    value:
      "Your payment is only released once the parcel is successfully delivered.",
    tag: "sender",
  },

  {
    Icon: Money,
    label: "Earn Extra Money",
    value: "Make money delivering packages on your existing trip.",
    tag: "traveler",
  },

  {
    Icon: Rocket,
    label: "Flexible & Fast",
    value:
      "Personalized delivery options based on real travelers going your way.",
    tag: "sender",
  },

  {
    Icon: LoveHands,
    label: "Help Family & Community",
    value: "Support people needing to send items home safely.",
    tag: "traveler",
  },
];
export const questions: InfoItem[] = [
  {
    label: "What items can I send ?",
    value:
      "You can send common personal items such as clothes, documents, and small electronics. All items must be legal and allowed for transport.",
    tag: "sender",
  },
  {
    label: "How is payment handled ? ",
    value:
      "The sender pays after you accept a request. Carry4Me securely holds the funds and releases them to you after delivery is confirmed.",
    tag: "traveler",
  },
  {
    label: "How do I send a parcel ?",
    value:
      "Post your parcel details, browse available travelers, and send a carry request. Once accepted, make payment and hand over the parcel.",
    tag: "sender",
  },

  {
    label: "Can I choose what parcels I carry ?",
    value:
      "Yes. You decide which requests to accept and can choose parcels that fit your space, preferences, and travel plans.",
    tag: "traveler",
  },

  {
    label: "How does pricing work ?",
    value:
      "Travelers set a price per kilogram. You see the total cost before requesting, so there are no surprises.",
    tag: "sender",
  },

  {
    label: "When do I get paid ?",
    value:
      "You get paid after delivery using a payout code provided by the sender or recipient.",
    tag: "traveler",
  },
];

export const travelers: Trip[] = [
  {
    user: {
      firstName: "Tariro",
      lastName: "Munatsi",
      id: 1,
    },
    route: {
      date: new Date("2026-01-23"),
      availableWeight: 4,
      pricePerKg: 20,
      origin: "UK",
      destination: "Zimbabwe",
      acceptedParcels: ["Documents"],
    },
    id: 1,
  },
  {
    user: {
      firstName: "Zvikomborero",
      lastName: "Makatendeka",
      id: 2,
    },
    route: {
      date: new Date("2026-01-23"),
      availableWeight: 4,
      pricePerKg: 15,
      origin: "UK",
      destination: "Zimbabwe",
      acceptedParcels: ["Documents"],
    },
    id: 3,
  },
  {
    user: {
      firstName: "Tanyaradzwa",
      lastName: "Mupangavanhu",
      id: 3,
    },
    route: {
      date: new Date("2026-01-23"),
      availableWeight: 4,
      pricePerKg: 25,
      origin: "UK",
      destination: "Zimbabwe",
      acceptedParcels: ["Documents"],
    },
    id: 4,
  },
];

export const loggedInUserParcel: Parcel = {
  user: {
    firstName: "Peter",
    lastName: "John",
    avatar: undefined,
    id: 4,
  },
  details: {
    pricePerKg: 10,
    weight: 5,
    origin: "UK",
    destination: "Zimbabwe",
    category: ["Clothes & Shoes"],
  },
  id: 9,
};

export const loggedInUserTrip: Trip = {
  user: {
    firstName: "Tanyaradzwa",
    lastName: "Mupangavanhu",
    id: 5,
  },
  route: {
    date: new Date("2026-01-23"),
    availableWeight: 4,
    pricePerKg: 15,
    origin: "UK",
    destination: "Zimbabwe",
    acceptedParcels: ["Documents"],
  },
  id: 9,
};

export const parlecs: Parcel[] = [
  {
    user: {
      firstName: "Kudzanai",
      lastName: "Raradza",
      avatar: undefined,
      id: 6,
    },
    details: {
      pricePerKg: 20,
      weight: 5,
      origin: "UK",
      destination: "Zimbabwe",
      category: ["Clothes & Shoes"],
    },
    id: 1,
  },

  {
    user: {
      firstName: "Peter",
      lastName: "John",
      avatar: undefined,
      id: 7,
    },
    details: {
      pricePerKg: 15,
      weight: 5,
      origin: "UK",
      destination: "Zimbabwe",
      category: ["Clothes & Shoes"],
    },
    id: 2,
  },

  {
    user: {
      firstName: "Elvis",
      lastName: "Mashinya",
      avatar: undefined,
      id: 8,
    },
    details: {
      pricePerKg: 30,
      weight: 5,
      origin: "UK",
      destination: "Zimbabwe",
      category: ["Clothes & Shoes"],
    },
    id: 3,
  },
];

export const carryRequests: CarryRequest = {
  id: 1,
  trip: loggedInUserTrip,
  parcel: loggedInUserParcel,
  status: "PENDING_PAYMENT",
  initiatorRole: "SENDER",
  pricePerKgAtRequest: 10,
  weightKgAtRequest: 5,
  totalPriceAtRequest: 50,
  currency: "GBP",
};
