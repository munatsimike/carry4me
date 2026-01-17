import CustomText from "@/components/ui/CustomText";
import SectionContainer from "./SectionContainer1";
type titleProps = {
  title: string;
};

//  Reusable section title for homepage sections (Benefits, Safety, FAQ)
export default function SectionTitle({ title }: titleProps) {
  return (
    <div className="flex itmes-center justify-center mb-8 md:mb-10">
      <CustomText as="h2" textVariant="primary" textSize="xxxl">
        {title}
      </CustomText>
    </div>
  );
}

// Subsection titles used to separate content for Senders and Travelers (Benefits, safety)
export function Subtitle() {
  return (
    <SectionContainer className="mb-8">
      <CustomText as="h2" textVariant="primary" textSize="xl">
        Senders
      </CustomText>

      <CustomText as="h2" textVariant="primary" textSize="xl">
        Travers
      </CustomText>
    </SectionContainer>
  );
}
