import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import DefualtContianer from "@/components/ui/DefualtContianer";
import { motion } from "framer-motion";

export function HeroSection() {
  const heading = "We match travelers with parcels that need to go home.";
  const subHeading =
    "Share your parcel or trip and match with a traveler or sender. Travelers earn, senders save.";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const word = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DefualtContianer className=" flex flex-col items-center mt-16">
      <motion.div variants={container} initial="hidden" animate="show">
        <Heading textSize="display" textVariant="primary">
          {String(heading)
            .split(" ")
            .map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                variants={word}
                style={{ display: "inline-block", marginRight: "0.25em" }}
              >
                {w}
              </motion.span>
            ))}
        </Heading>
      </motion.div>
      <SubHeading textSize="md" as="p">
        {subHeading}
      </SubHeading>
      <ActionButtons />
    </DefualtContianer>
  );
}
