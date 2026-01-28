import CustomText from "@/components/ui/CustomText";

type LinkTextProps = {
  linkText: string;
  className?: string;
};

export default function LinkText({ linkText, className }: LinkTextProps) {
  return (
    <CustomText
      as="p"
      textVariant="linkText"
      aria-live="polite"
      className={`hover:text-primary-600 underline-offset-2 hover:underline cursor-pointer ... ${className}`}
    >
      {linkText}
    </CustomText>
  );
}
