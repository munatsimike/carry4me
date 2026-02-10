import CustomText from "@/components/ui/CustomText";

type LabelTextRowProps = {
  label: string;
  text: string;
};

export default function LabelTextRow({ label, text }: LabelTextRowProps) {
  return (
    <span className="grid grid-cols-2">
      <CustomText as="span" textSize="xsm" textVariant="neutral" className="leading-tight">
        {label}
      </CustomText>

      <CustomText
        as="span"
        textVariant="primary"
        textSize="xsm"
        className="pl-1 leading-tight"
      >
        {text}
      </CustomText>
    </span>
  );
}
