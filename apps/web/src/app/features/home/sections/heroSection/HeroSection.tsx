import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import DefualtContianer from "@/components/ui/DefualtContianer";
import { motion } from "framer-motion";

export function HeroSection() {
  const heading = "We match travelers with parcels that need to go home.";
  const subHeading =
    "List your parcel or trip and get matched with a trusted sender or traveler. Travelers earn, senders save.";

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const word = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <DefualtContianer className=" flex flex-col items-center mt-6 sm:mt-14">
      <motion.div variants={container} initial="hidden" animate="show">
        <Heading
          textSize="display"
          textVariant="primary"
          className="leading-tight pb-2 sm:pb-0 font-medium"
        >
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
