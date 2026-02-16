import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { Step } from "@/types/Ui";

type StepProps = {
  step: Step;
};

export default function StepItem({ step }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <CircleBadge bgColor="onDark" size="lg">
        <CustomText as="h3" textSize="md" textVariant="primary">
          {step.step}
        </CustomText>
      </CircleBadge>
      <CustomText as="h3" textVariant="primary" textSize="lg">
        {step.title}
      </CustomText>
      <CustomText as="p" textSize="sm">
        {step.description}
      </CustomText>
    </div>
  );
}
