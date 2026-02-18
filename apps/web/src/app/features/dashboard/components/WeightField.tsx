import { InlineRow } from "@/app/components/InlineRow";
import ErrorText from "@/app/components/text/ErrorText";
import { baseInput, cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

type WeightFieldProps = {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
};

export default function WeightField({ id, register, error }: WeightFieldProps) {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <label id={id} htmlFor="weight">
          {<CustomText textSize="xsm">{"Available space (Kg)"}</CustomText>}
        </label>
        <InlineRow>
          {
            <input
              type="number"
              id={id}
              className={cn(`w-full rounded-lg sm:w-[100px] py-2 px-2 ${baseInput}`)}
              {...register}
            ></input>
          }
        </InlineRow>
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}
