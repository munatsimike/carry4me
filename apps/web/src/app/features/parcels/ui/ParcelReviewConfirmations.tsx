import CheckBox from "@/app/components/CheckBox";
import ErrorText from "@/app/components/text/ErrorText";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import CustomText from "@/components/ui/CustomText";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

type ParcelReviewConfirmationsProps = {
  register: UseFormRegister<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
};

function ConfirmationRow({
  id,
  label,
  register,
  error,
}: {
  id: string;
  label: string;
  register: ReturnType<UseFormRegister<ParcelFormFields>>;
  error?: string;
}) {
  return (
    <ErrorText error={error}>
      <div className="flex gap-3">
        <CheckBox register={register} id={id} />
        <label htmlFor={id} className="cursor-pointer">
          <CustomText as="span" textVariant="formText" textSize="sm">
            {label}
          </CustomText>
        </label>
      </div>
    </ErrorText>
  );
}

export default function ParcelReviewConfirmations({
  register,
  errors,
}: ParcelReviewConfirmationsProps) {
  return (
    <div className="flex flex-col gap-3">
      <ConfirmationRow
        id="parcel-no-prohibited-items"
        label="I confirm this package contains no prohibited items"
        register={register("confirmNoProhibitedItems")}
        error={errors.confirmNoProhibitedItems?.message}
      />
      <ConfirmationRow
        id="parcel-traveler-inspection"
        label="I understand the traveler may inspect the package before acceptance"
        register={register("understandTravelerInspection")}
        error={errors.understandTravelerInspection?.message}
      />
    </div>
  );
}
