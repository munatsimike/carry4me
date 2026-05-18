import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import DefualtContianer from "@/components/ui/DefualtContianer";
import { motion } from "framer-motion";

export function HeroSection() {
  const heading = "We match travelers with parcels that need to go home.";
  const subHeading =
    "List a parcel or trip and get matched. Travelers earn extra, and senders save on delivery.";

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
    <DefualtContianer
      outerClassName="bg-gradient-to-b from-primary-50 via-white to-white"
      className="pt-8 sm:pt-12 lg:pt-16"
    >
      <div className="flex flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-10 lg:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl"
      >
        <Heading
          textSize="display"
          textVariant="primary"
          className="pb-1 font-medium leading-[1.08] sm:pb-2"
        >
          {heading
            .replace("go home.", "go\u00A0home.")
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
      <SubHeading
        textSize="md"
        as="p"
        textVariant="secondary"
        className="max-w-3xl text-left leading-relaxed sm:text-center"
      >
        {subHeading}
      </SubHeading>
      <ActionButtons />
      </div>
    </DefualtContianer>
  );
}
