import CustomText from "@/components/ui/CustomText";

type LabelTextRowProps = {
  label: string;
  text: string;
};

export default function LableTextRow({ label, text }: LabelTextRowProps) {
 return <span className="inline flex items-center gap-2">
    <CustomText textSize="xsm" textVariant="neutral"> {label}</CustomText>
    <CustomText textVariant="primary"> {text}</CustomText>
  </span>;
}
