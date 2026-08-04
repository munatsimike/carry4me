import Heading from "@/components/ui/CustomText";
import SubHeading from "@/components/ui/CustomText";
import ActionButtons from "./ActionButtons";
import DefualtContianer from "@/components/ui/DefualtContianer";
import { motion } from "framer-motion";

const DESKTOP_MASK =
  "linear-gradient(115deg, transparent 0%, transparent 18%, rgba(0, 0, 0, 0.35) 28%, black 42%)";

const MOBILE_MASK =
  "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.35) 16%, black 38%)";

const WHITE_WASH_DESKTOP =
  "linear-gradient(115deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0.38) 100%)";

const WHITE_WASH_MOBILE =
  "linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.4) 100%)";

const dissolveIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: 1.8,
    delay: 0.15,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

const dissolveBreathe = {
  animate: { opacity: [0.85, 1, 0.85] },
  transition: {
    duration: 7,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "mirror" as const,
  },
};

export function HeroSection() {
  const heading = "Send parcels home with trusted travelers.";
  const subHeading =
    "Post a parcel or trip and connect with travelers or senders.";

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
    <section className="relative overflow-hidden bg-white">
      {/* Desktop: side image with diagonal dissolve */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[35%] overflow-hidden lg:block"
        style={{
          WebkitMaskImage: DESKTOP_MASK,
          maskImage: DESKTOP_MASK,
        }}
        {...dissolveIn}
      >
        <motion.img
          src="/images/hero-image.png"
          alt=""
          className="h-full w-full object-cover object-[22%_42%] brightness-[0.98] contrast-[0.96] saturate-[0.92]"
          {...dissolveBreathe}
        />
        <div
          className="absolute inset-0"
          style={{ background: WHITE_WASH_DESKTOP }}
        />
      </motion.div>

      <DefualtContianer className="relative z-10 pt-8 sm:pt-12 lg:pt-16">
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
              {heading.split(" ").map((w, i) => (
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

          {/* Mobile + tablet: image below copy so text stays clear */}
          <motion.div
            aria-hidden
            className="relative mt-2 h-44 w-full max-w-3xl overflow-hidden sm:h-56 lg:hidden"
            style={{
              WebkitMaskImage: MOBILE_MASK,
              maskImage: MOBILE_MASK,
            }}
            {...dissolveIn}
          >
            <motion.img
              src="/images/hero-image.png"
              alt=""
              className="h-full w-full object-cover object-[28%_40%] brightness-[0.98] contrast-[0.96] saturate-[0.92]"
              {...dissolveBreathe}
            />
            <div
              className="absolute inset-0"
              style={{ background: WHITE_WASH_MOBILE }}
            />
          </motion.div>
        </div>
      </DefualtContianer>
    </section>
  );
}
