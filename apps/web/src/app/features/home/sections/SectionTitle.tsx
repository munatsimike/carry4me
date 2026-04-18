import CustomText from "@/components/ui/CustomText";
type titleProps = {
  title: string;
};

//  Reusable section title for homepage sections (Benefits, Safety, FAQ)
export default function SectionTitle({ title }: titleProps) {
  return (
    <div className="flex itmes-center sm:justify-center pb-6 sm:pb-2 sm:pt-0 md:mb-6">
      <CustomText
        as="h2"
        textVariant="primary"
        textSize="xxxl"
        className="font-medium"
      >
        {title}
      </CustomText>
    </div>
  );
}
