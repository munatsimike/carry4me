import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { Step } from "@/types/Ui";

type StepProps = {
  step: Step;
};

export default function StepItem({ step }: StepProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="flex gap-4 items-center sm:flex-col sm:gap-3 sm:items-start">
        <CircleBadge bgColor="primary" size="lg">
          <CustomText as="h3" textSize="md" textVariant="primary">
            {step.step}
          </CustomText>
        </CircleBadge>
        <CustomText
          as="h3"
          textVariant="primary"
          textSize="lg"
          className="font-medium"
        >
          {step.title}
        </CustomText>
      </div>

      <CustomText as="p" textSize="sm" className="pl-[52px] sm:pl-[0px]">
        {step.description}
      </CustomText>
    </div>
  );
}
