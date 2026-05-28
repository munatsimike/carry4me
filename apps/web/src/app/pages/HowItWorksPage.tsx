import { steps } from "@/app/Data";
import HowItWorks from "@/app/features/home/sections/howItWorks/HowItWorks";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
  return (
    <>
      <DefaultContainer outerClassName="py-6 sm:py-8">
        <div className="mx-auto max-w-3xl flex flex-col gap-3">
          <CustomText as="h1" textVariant="primary" textSize="xxl" className="font-semibold">
            How it works
          </CustomText>
          <CustomText as="p" textSize="md" textVariant="secondary" className="leading-relaxed">
            Four simple steps to send or carry a parcel on Carry4Me. For pricing
            details, see our{" "}
            <Link
              to="/pricing"
              className="font-medium text-primary-600 underline-offset-2 hover:underline"
            >
              Pricing
            </Link>{" "}
            page.
          </CustomText>
        </div>
      </DefaultContainer>
      <HowItWorks steps={steps} />
    </>
  );
}
