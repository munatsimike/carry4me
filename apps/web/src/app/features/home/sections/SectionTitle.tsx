import CustomText from "@/components/ui/CustomText";
type titleProps = {
  title: string;
};

//  Reusable section title for homepage sections (Benefits, Safety, FAQ)
export default function SectionTitle({ title }: titleProps) {
  return (
    <div className="flex items-center justify-center pb-5 text-center sm:pb-3 md:mb-5">
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
