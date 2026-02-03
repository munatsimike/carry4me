
import type { UseFormRegisterReturn } from "react-hook-form";

type CheckBoxProps = {
  id: string;
  register?: UseFormRegisterReturn;

};

export default function CheckBox({ id, register }: CheckBoxProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer">
      <input
        {...register}
        id={id}
        type="checkbox"
        className="h-4 w-4"
      />
    </label>
  );
}
