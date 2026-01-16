import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros } from "@/types/Ui";
import StepItem from "./StepItem";
import CustomText from "@/components/ui/CustomText";

export default function HowItWorks({ steps }: StepsPros) {
  return (
    <DefaultContainer outerClassName="bg-primary-50" className="flex flex-col">
      <div className="flex itmes-center justify-center mb-8 md:mb-10">
        <CustomText as="h2" textVariant="primary" textSize="xxl">
          How it works
        </CustomText>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <StepItem step={step} />
        ))}
      </section>
    </DefaultContainer>
  );
}
