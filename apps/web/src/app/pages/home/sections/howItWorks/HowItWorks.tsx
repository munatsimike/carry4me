import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros } from "@/types/Ui";
import StepItem from "./StepItem";
import SectionTitle from "../SectionTitle";

export default function HowItWorks({ steps }: StepsPros) {
  return (
    <DefaultContainer outerClassName="bg-neutral-200" className="flex flex-col">
      <SectionTitle title="How it works" />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <StepItem key={index} step={step} />
        ))}
      </section>
    </DefaultContainer>
  );
}
