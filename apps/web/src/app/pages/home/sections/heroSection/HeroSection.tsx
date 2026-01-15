import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import StatsSection from "./StatsSection";
import DefualtContianer from "@/components/ui/DefualtContianer";
import ParcelIcon from "@/assets/parcelIcon.svg?react";
import TravelIcon from "@/assets/travelerIcon.svg?react";
import Globe from "@/assets/globe.svg?react";

export function HeroSection() {
  const heading = "We match travelers with parcels that need to go home.";
  const subHeading =
    "Share your parcel or trip and match with a traveler or sender. Travelers earn, senders save.";

  type Stat = {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: string;
  };

  const stats: Stat[] = [
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

  return (
    <DefualtContianer className=" flex flex-col items-center mt-16">
      <Heading textSize="xxl" textVariant="primary">
        {heading}
      </Heading>
      <SubHeading textSize="sm" as="p">
        {subHeading}
      </SubHeading>
      <ActionButtons />
      <StatsSection stats={stats} />
    </DefualtContianer>
  );
}
