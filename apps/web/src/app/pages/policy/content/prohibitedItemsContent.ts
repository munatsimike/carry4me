import type { PolicyPageContent } from "../types";
import { POLICY_LAST_UPDATED } from "./policyLastUpdated";

export const prohibitedItemsContent: PolicyPageContent = {
  title: "Prohibited Items",
  description:
    "Carry4Me may only be used for legal goods. Senders and travelers are responsible for compliance with local, national, and international laws.",
  lastUpdated: POLICY_LAST_UPDATED,
  sections: [
    {
      id: "illegal",
      title: "Illegal Items",
      paragraphs: ["The following are strictly prohibited:"],
      bullets: [
        "Illegal drugs or controlled substances",
        "Weapons, ammunition, or explosives",
        "Stolen goods or counterfeit products",
        "Child exploitation material or other illegal content",
      ],
    },
    {
      id: "dangerous",
      title: "Dangerous Goods",
      bullets: [
        "Flammable, explosive, or pressurized materials",
        "Hazardous chemicals, acids, or toxic substances",
        "Lithium batteries not packaged according to safety rules",
        "Biological samples or medical waste without proper authorization",
      ],
    },
    {
      id: "restricted",
      title: "Restricted Goods",
      bullets: [
        "Cash, bearer instruments, or items requiring special licenses",
        "Alcohol, tobacco, or regulated goods where transport is restricted",
        "Live animals (except as explicitly permitted by law and platform rules)",
        "Items that violate intellectual property rights",
      ],
    },
    {
      id: "customs",
      title: "Customs Compliance",
      paragraphs: [
        "Senders must declare contents accurately. Travelers must not carry items that cannot legally cross relevant borders. Duties, permits, and declarations are the responsibility of the parties involved.",
      ],
    },
    {
      id: "consequences",
      title: "Consequences of Violations",
      bullets: [
        "Immediate cancellation of active bookings",
        "Account suspension or permanent ban",
        "Withholding or reversal of payments where permitted",
        "Reporting to law enforcement when required",
      ],
    },
  ],
};
