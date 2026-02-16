import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros } from "@/types/Ui";
import StepItem from "./StepItem";
import SectionTitle from "../SectionTitle";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { motion } from "framer-motion";

export default function HowItWorks({ steps }: StepsPros) {
  const howItWorksContainer = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.35, // <- starts after hero heading
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const howItWorksItem = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DefaultContainer outerClassName="bg-canvas" className="flex flex-col">
      <motion.div
        variants={howItWorksContainer}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.div variants={howItWorksItem}>
          <SectionTitle title="How it works" />
        </motion.div>

        {/* Steps grid */}
        <motion.section
          variants={howItWorksContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={howItWorksItem}
            >
              <StepItem step={step} />
            </motion.div>
          ))}
        </motion.section>

        {/* CTA */}
        <motion.div
          className="flex justify-center pt-6"
          variants={howItWorksItem}
        >
          <motion.div>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              size="lg"
              leadingIcon={
                <SvgIcon
                  color="primary"
                  size="lg"
                  Icon={META_ICONS.addAccount}
                />
              }
            >
              <CustomText textVariant="primary">
                Sign up to get started
              </CustomText>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </DefaultContainer>
  );
}
