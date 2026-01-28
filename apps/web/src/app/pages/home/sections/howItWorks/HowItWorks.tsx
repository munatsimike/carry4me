import DefaultContainer from "@/components/ui/DefualtContianer";
import type { StepsPros } from "@/types/Ui";
import StepItem from "./StepItem";
import SectionTitle from "../SectionTitle";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";

export default function HowItWorks({ steps }: StepsPros) {
  return (
    <DefaultContainer outerClassName="bg-canvas" className="flex flex-col">
      <SectionTitle title="How it works" />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <StepItem key={index} step={step} />
        ))}
      </section>

      <div className="flex justify-center py-6">
        <Button
          variant={"secondary"}
          size={"lg"}
          leadingIcon={<SvgIcon size={"lg"} Icon={META_ICONS.addAccount} />}
        >
          <CustomText textVariant="primary">{"Sign up"}</CustomText>
        </Button>
      </div>
    </DefaultContainer>
  );
}
