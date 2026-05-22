import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";

type formHeaderProps = {
  icon?: React.ReactNode;
  heading: string;
  subHeading: string;
  size?: "sm" | "md" | "lg";
};

export default function FormHeader({
  icon,
  heading,
  subHeading,
}: formHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <CircleBadge size="lg" bgColor="secondary">
        {icon}
      </CircleBadge>
      <span className="flex flex-col gap-1 items-center">
        <CustomText textSize="lg" textVariant="primary" className="font-medium">
          {heading}
        </CustomText>
        <CustomText textSize="sm" as="h2" className="sm:leading-none">
          {subHeading}
        </CustomText>
      </span>
    </div>
  );
}
