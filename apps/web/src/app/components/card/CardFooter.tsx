import { Button } from "@/components/ui/Button";
import SvgIcon from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import CustomText from "@/components/ui/CustomText";

export default function CardFooter() {
  return (
    <div className="flex justify-end items-center">
      <Button
        variant={"tripPrimary"}
        size={"sm"}
        leadingIcon={<SvgIcon size={"sm"} Icon={SendIcon}></SvgIcon>}
      >
        <CustomText
          className="text-white"
          as="span"
          textSize={"xsm"}
          textVariant="primary"
        >
          Send request
        </CustomText>
      </Button>
    </div>
  );
}
