import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros } from "@/types/Ui";
import SectionTitle from "../SectionTitle";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { motion } from "framer-motion";
import type { Step } from "@/types/Ui";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";

export default function HowItWorks({ steps }: StepsPros) {
  const { openSignInModal } = useSignInModal();
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
    <DefaultContainer outerClassName="bg-canvas" className="flex flex-col py-8 sm:py-10">
      <motion.div
        variants={howItWorksContainer}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.div variants={howItWorksItem}>
          <SectionTitle title="How it works" />
        </motion.div>

        {/* Steps timeline */}
        <motion.section
          variants={howItWorksContainer}
          className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-0"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={howItWorksItem}>
              <StepItem
                step={step}
                isLast={index === steps.length - 1}
              />
            </motion.div>
          ))}
        </motion.section>

        {/* CTA */}
        <motion.div
          className="flex justify-center pt-6 sm:pt-8"
          variants={howItWorksItem}
        >
          <motion.div>
            <Button
              type="button"
              onClick={() => openSignInModal({ redirectTo: "/dashboard" })}
              className="w-full sm:w-[250px]"
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
              <CustomText textVariant="primary">Get started</CustomText>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </DefaultContainer>
  );
}

type StepProps = {
  step: Step;
  isLast?: boolean;
};

function StepItem({ step, isLast = false }: StepProps) {
  return (
    <div className="relative flex gap-4 rounded-3xl bg-white/80 px-4 pb-4 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md lg:h-full lg:flex-col lg:rounded-none lg:bg-transparent  lg:shadow-none lg:ring-0 lg:hover:bg-transparent lg:hover:shadow-none">
      {!isLast && (
        <>
          <span className="absolute left-9 top-14 h-[calc(100%-3rem)] w-px bg-slate-200 lg:left-[calc(50%+1.25rem)] lg:top-[22px] lg:h-px lg:w-[calc(100%-2.5rem)]" />
          <span className="absolute left-9 top-14 h-10 w-px bg-primary-200 lg:left-[calc(50%+1.25rem)] lg:top-[22px] lg:h-px lg:w-10" />
        </>
      )}

      <div className="relative z-10 shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-200 bg-white text-lg font-semibold text-primary-600 shadow-sm">
          {step.step}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 lg:pt-1">
        <CustomText
          as="h3"
          textVariant="primary"
          textSize="lg"
          className="font-medium"
        >
          {step.title}
        </CustomText>

        <CustomText as="p" textSize="sm" className="leading-relaxed">
          {step.description}
        </CustomText>
      </div>
    </div>
  );
}
