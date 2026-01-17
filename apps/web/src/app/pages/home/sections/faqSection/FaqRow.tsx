import type { InfoItem } from "@/types/Ui";
import SvgIcon from "@/components/ui/SvgIcon";
import { DEFAULT_VARIANT, tagToVariant } from "@/app/Mapper";
import SectionItem from "../SectionItem";
import CustomText from "@/components/ui/CustomText";

type FaqRowProps = {
  item: InfoItem;
  isOpen: boolean;
  onToggle: () => void;
};

export default function FaqRow({ item, isOpen, onToggle }: FaqRowProps) {
  const variant = item.tag ? tagToVariant[item.tag] : DEFAULT_VARIANT;
  return (

      <SectionItem
        className="pl-[30px]"
        icon={ item.Icon &&
          <SvgIcon
            size={"sm"}
            Icon={item.Icon}
            color={variant}
            className={`transition-transform duration-700 ease-out  ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        }
        label={
          <CustomText textVariant="primary" textSize="lg">
            {item.label}
          </CustomText>
        }
        description={
          <CustomText
            textVariant="secondary"
            textSize="sm"
            className={[
              "overflow-hidden transition-all duration-700 ease-in-out",
              isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            {item.value}
          </CustomText>
        }
      ></SectionItem>
  );
}
