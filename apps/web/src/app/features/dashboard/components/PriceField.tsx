import ErrorText from "@/app/components/text/ErrorText";
import { baseInput, cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

type PriceFieldProps = {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
};

export default function PriceField({ register, id, error }: PriceFieldProps) {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <CustomText textSize="xsm">{"Price per kg"}</CustomText>
        {
          <input
            type="number"
            id={id}
            className={cn(`w-full rounded-lg sm:w-[100px] py-2 px-2 ${baseInput}`)}
            {...register}
          />
        }
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}
