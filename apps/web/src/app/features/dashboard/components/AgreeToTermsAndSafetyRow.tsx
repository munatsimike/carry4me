import CheckBox from "@/app/components/CheckBox";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Link } from "react-router-dom";

type AgreeToTermsAndSafetyRowProps = {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
};

export default function AgreeToTermsAndSafetyRow({
  register,
  id,
  error,
}: AgreeToTermsAndSafetyRowProps) {
  return (
    <ErrorText error={error}>
      <div className="flex gap-3">
        <CheckBox register={register} id={id} />
        <label htmlFor={id} className="cursor-pointer">
          <CustomText as="span" textVariant="formText" textSize="sm">
            I agree to the{" "}
            <Link
              to="/terms"
              className="font-medium text-primary-600 underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Terms & Conditions
            </Link>{" "}
            &{" "}
            <Link
              to="/safety"
              className="font-medium text-primary-600 underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Safety Center
            </Link>
          </CustomText>
        </label>
      </div>
    </ErrorText>
  );
}
