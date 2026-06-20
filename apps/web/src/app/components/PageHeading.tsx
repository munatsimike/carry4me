import CustomText from "@/components/ui/CustomText";

type PageHeadingProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="min-w-0 w-full">
      <CustomText
        as="h1"
        textVariant="primary"
        textSize="md"
        className="font-semibold sm:text-xl lg:text-2xl"
      >
        {title}
      </CustomText>
      {subtitle ? (
        <CustomText
          as="p"
          textSize="sm"
          textVariant="secondary"
          className="mt-1 max-w-2xl text-sm leading-relaxed sm:text-base"
        >
          {subtitle}
        </CustomText>
      ) : null}
    </div>
  );
}
