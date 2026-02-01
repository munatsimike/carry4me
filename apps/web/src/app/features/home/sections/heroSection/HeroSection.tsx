import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import StatsSection from "./StatsSection";
import DefualtContianer from "@/components/ui/DefualtContianer";
import { stats } from "../../../../Data";

export function HeroSection() {
  const heading = "We match travelers with parcels that need to go home.";
  const subHeading =
    "Share your parcel or trip and match with a traveler or sender. Travelers earn, senders save.";

  return (
    <DefualtContianer className=" flex flex-col items-center mt-16">
      <Heading textSize="display" textVariant="primary">
        {heading}
      </Heading>
      <SubHeading textSize="md" as="p">
        {subHeading}
      </SubHeading>
      <ActionButtons />
    </DefualtContianer>
  );
}
