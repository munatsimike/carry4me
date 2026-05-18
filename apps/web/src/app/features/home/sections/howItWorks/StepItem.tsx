import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { Step } from "@/types/Ui";

type StepProps = {
  step: Step;
  isLast?: boolean;
};

export default function StepItem({ step, isLast = false }: StepProps) {
  return (
    <div className="relative flex gap-4 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md lg:h-full lg:flex-col lg:gap-5 lg:rounded-none lg:bg-transparent lg:p-5 lg:shadow-none lg:ring-0 lg:hover:bg-transparent lg:hover:shadow-none">
      {!isLast && (
        <>
          <span className="absolute left-9 top-14 h-[calc(100%-3rem)] w-px bg-slate-200 lg:left-[calc(50%+1.25rem)] lg:top-10 lg:h-px lg:w-[calc(100%-2.5rem)]" />
          <span className="absolute left-9 top-14 h-10 w-px bg-primary-200 lg:left-[calc(50%+1.25rem)] lg:top-10 lg:h-px lg:w-10" />
        </>
      )}

      <div className="relative z-10 shrink-0">
        <CircleBadge bgColor="primary" size="lg">
          <CustomText as="h3" textSize="md" textVariant="primary">
            {step.step}
          </CustomText>
        </CircleBadge>
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
