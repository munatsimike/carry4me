import CustomText from "@/components/ui/CustomText";

type ErrorTextProps = {
  error?: string;
  className?: string;
};

export default function ErrorText({ error, className }: ErrorTextProps) {
  return (
    <CustomText
      as="p"
      textVariant="error"
      aria-live="polite"
      className={`absolute text-sm pt-0
        transition-all duration-200 ease-out
        ${error ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
        ${className ?? ""}
      `}
    >
      {error}
    </CustomText>
  );
}