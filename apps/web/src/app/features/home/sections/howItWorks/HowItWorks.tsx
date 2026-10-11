import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros, SvgIconComponent } from "@/types/Ui";
import SectionTitle from "../SectionTitle";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import HoverFillIcon from "@/app/components/HoverFillIcon";
import { motion } from "framer-motion";
import type { Step } from "@/types/Ui";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { createElement } from "react";
import {
  CreditCard,
  FilePlus2,
  Truck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const STEP_ICONS: Record<number, LucideIcon> = {
  1: FilePlus2,
  2: Users,
  3: CreditCard,
  4: Truck,
};

const UserPlusOutlined: SvgIconComponent = (props) =>
  createElement(UserPlus, { ...props, fill: "none", strokeWidth: 1.75 });

const UserPlusFilled: SvgIconComponent = (props) =>
  createElement(UserPlus, {
    ...props,
    fill: "currentColor",
    strokeWidth: 1.75,
  });

export default function HowItWorks({ steps }: StepsPros) {
  const { openSignUpModal } = useSignInModal();
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
    <DefaultContainer
      id="how-it-works"
      outerClassName="bg-canvas scroll-mt-20"
      className="flex flex-col py-8 sm:py-10"
    >
      <motion.div
        variants={howItWorksContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={howItWorksItem}>
          <SectionTitle title="How it works" />
        </motion.div>

        <motion.section
          variants={howItWorksContainer}
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:gap-3 xl:grid-cols-4 xl:gap-2"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={howItWorksItem}
              className="h-full min-w-0"
            >
              <StepItem step={step} />
            </motion.div>
          ))}
        </motion.section>

        <motion.div
          className="flex w-full justify-center pt-6 sm:pt-8"
          variants={howItWorksItem}
        >
          <motion.div className="w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => openSignUpModal({ redirectTo: "/dashboard" })}
              className="group w-full border border-primary-200 sm:w-[250px]"
              variant="secondary"
              size="lg"
              leadingIcon={
                <HoverFillIcon
                  Outlined={UserPlusOutlined}
                  Filled={UserPlusFilled}
                  size="lg"
                  className="text-primary-500"
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
};

function StepItem({ step }: StepProps) {
  const StepIcon = STEP_ICONS[step.step] ?? FilePlus2;

  return (
    <div className="flex h-full min-w-0 w-full flex-col gap-2.5 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:px-5 sm:py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
          {step.step}
        </div>
        <StepIcon
          className="h-8 w-8 shrink-0 text-primary-500"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <CustomText
          as="h3"
          textVariant="primary"
          textSize="md"
          className="font-semibold"
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
