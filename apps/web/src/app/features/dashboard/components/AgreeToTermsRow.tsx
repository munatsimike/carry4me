import CheckBox from "@/app/components/CheckBox";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

type AgreeToTermsProps = {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
};

export default function AgreeToTermsRow({
  register,
  id,
  error,
}: AgreeToTermsProps) {
  return (
    <ErrorText error={error}>
      <div className="flex flex-col">
        <div className="flex gap-3">
          <CheckBox register={register} id={id}></CheckBox>
          <CustomText textVariant="formText" textSize="xsm">
            {"I agree to the terms and conditions."}
          </CustomText>
        </div>
      </div>
    </ErrorText>
  );
}
