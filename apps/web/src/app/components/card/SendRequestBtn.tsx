import { Button, type ButtonVariant } from "@/components/ui/Button";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";

type SendRequestBtnProps<T> = {
  payLoad: T;
  primaryAction: (payLoad: T) => void;
  secondaryAction?: () => void;
  buttonVariant?: ButtonVariant,
  iconColorVariant?:IconColor,
  buttonTextVariant?: TextVariant
};

export default function SendRequestBtn<T>({
  primaryAction,
  secondaryAction,
  payLoad,
  buttonVariant = "primary",
  buttonTextVariant = "onDark",
  iconColorVariant ="onDark"
}: SendRequestBtnProps<T>) {
  const base = "flex items-center";
  const alignment = secondaryAction ? "justify-between" : "justify-end";
  return (
    <div className={`${base} ${alignment}`}>
      {secondaryAction && (
        <Button
          onClick={() => secondaryAction()}
          variant="neutral"
          size={"sm"}
          leadingIcon={undefined}
        >
          <CustomText
            as="span"
            textSize={"xsm"}
            textVariant="primary"
            className="px-3"
          >
            Cancel
          </CustomText>
        </Button>
      )}
      <Button
        onClick={() => primaryAction(payLoad)}
        variant={buttonVariant}
        size={"sm"}
        leadingIcon={
          <SvgIcon size={"sm"} Icon={SendIcon} color={iconColorVariant}></SvgIcon>
        }
      >
        <CustomText
          as="span"
          textSize={"xsm"}
          textVariant={buttonTextVariant}
        >
          Send request
        </CustomText>
      </Button>
    </div>
  );
}
