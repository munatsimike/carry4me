import { Card } from "@/app/components/card/Card";
import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { AuthEntryButtons } from "./AuthEntryButtons";

export function AuthEntryPage() {
  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          enableHover={false}
          className="w-full max-w-md"
          paddingClass="px-6 py-6"
        >
          <div className="flex flex-col gap-4">
            <CustomText textSize="lg" textVariant="primary" className="font-medium">
              Welcome
            </CustomText>
            <CustomText textSize="sm" textVariant="secondary">
              Choose how you want to continue.
            </CustomText>
            <AuthEntryButtons className="flex flex-col gap-3 sm:flex-row" />
          </div>
        </Card>
      </div>
    </DefaultContainer>
  );
}
