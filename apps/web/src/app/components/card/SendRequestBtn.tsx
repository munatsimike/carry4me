import { Button } from "@/components/ui/Button";
import SvgIcon from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import CustomText from "@/components/ui/CustomText";

type SendRequestBtnProps<T> = {
  payLoad: T;
  primaryAction: (payLoad: T) => void;
  secondaryAction?: () => void;
};

export default function SendRequestBtn<T>({
  primaryAction,
  secondaryAction,
  payLoad,
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
        variant={"primary"}
        size={"sm"}
        leadingIcon={
          <SvgIcon size={"sm"} Icon={SendIcon} color="onDark"></SvgIcon>
        }
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
