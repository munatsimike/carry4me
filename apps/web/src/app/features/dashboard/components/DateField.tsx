import ErrorText from "@/app/components/text/ErrorText";
import { baseInput, cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

type DateInputProps = {
  error?: string;
  id: string;
  label: string;
  className?: string;

  register: UseFormRegisterReturn;
};

export default function DateField({
  error,
  id,
  label,

  className = "flex flex-col gap-2",
  register,
}: DateInputProps) {
  return (
    <div>
      <div className={className}>
        <label htmlFor={id}>
          <CustomText textSize="xsm">{label}</CustomText>
        </label>

        <input
          {...register}
          id={id}
          type="date"
          className={cn(
            `w-full sm:w-[150px] px-2 py-2 ${baseInput}`,
          )}
        />
      </div>
      {error && <ErrorText error={error}></ErrorText>}
    </div>
  );
}
