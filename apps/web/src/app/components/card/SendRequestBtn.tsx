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
  buttonTextVariant = "primary",
  iconColorVariant ="onDark"
}: SendRequestBtnProps<T>) {
  const base = "flex items-center w-full";
  const alignment = secondaryAction ? "justify-between" : "justify-end";
  return (
    <div className={`${base} ${alignment}`}>
      <Button
        onClick={() => primaryAction(payLoad)}
        variant={buttonVariant}
        className="shadow-sm w-full"
        size={"sm"}
        leadingIcon={
          <SvgIcon size={"sm"} Icon={SendIcon} color={iconColorVariant}></SvgIcon>
        }
      >
        <CustomText
          as="span"
          textSize={"sm"}
          textVariant={buttonTextVariant}
        >
          Send request
        </CustomText>
      </Button>
    </div>
  );
}
