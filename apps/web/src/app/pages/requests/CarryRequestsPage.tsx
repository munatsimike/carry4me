import { Card } from "@/app/components/card/Card";
import LineDivider from "@/app/components/LineDivider";
import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SvgIcon from "@/components/ui/SvgIcon";

export default function CarryRequestsPage() {
  return (
    <DefaultContainer>
      <Card>
        <div className="flex flex-col gap-3">
          <Header />
          <LineDivider />
          <ProgressRow />
          <LineDivider />
        </div>
      </Card>
    </DefaultContainer>
  );
}

function Header() {
  return (
    <div className="flex justify-between">
      <Status />
      <span className="inline-flex flex-col gap-1">
        <CustomText> {"Carry Request"}</CustomText>
        <CustomText> {"#46545"}</CustomText>
      </span>
    </div>
  );
}

function Status() {
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-2">
        <CustomText> {"Status : "}</CustomText>
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex rounded-full h-3 w-3 bg-primary-500" />
          <CustomText> {"Pending Response"}</CustomText>
        </div>
      </span>
      <CustomText as="span" className="pl-20">
        {"Pending Response"}
      </CustomText>
    </div>
  );
}

function ProgressRow() {
  return (
    <div className="flex items-center gap-5">
      <Progress status={true} stage={"Request sent"} />
      <Progress status={false} stage={"Request accepted"} />
      <Progress status={false} stage={"Payment completed"} />
      <Progress status={false} stage={"Parcel received"} />
      <Progress status={false} stage={"Parcel delivered"} />
      <Progress status={false} stage={"Payment released"} />
    </div>
  );
}

function Progress({
  status = false,
  stage,
}: {
  status?: boolean;
  stage: string;
}) {
  const iconColor = status ? "trip" : "neutral";
  const textColor = status ? "primary" : "secondary";
  return (
    <span className="inline-flex gap-2 items-center">
      <SvgIcon color={iconColor} size={"md"} Icon={META_ICONS.checkedIcon} />
      <CustomText textSize="xsm" textVariant={textColor}>
        {stage}
      </CustomText>
    </span>
  );
}
