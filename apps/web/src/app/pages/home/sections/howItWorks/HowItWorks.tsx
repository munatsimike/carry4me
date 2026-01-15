import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";

export default function HowItWorks() {
  return (
    <DefaultContainer outerClassName="bg-primary-50" className="flex flex-col">
      <CustomText as="h1">How it works</CustomText>
    </DefaultContainer>
  );
}
