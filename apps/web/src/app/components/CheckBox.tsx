import type { UseFormRegisterReturn } from "react-hook-form";
import { checkBox, checkBoxSvg } from "../lib/cn";

type CheckBoxProps = {
  id: string;
  register?: UseFormRegisterReturn;
};

export default function CheckBox({ id, register }: CheckBoxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer relative inline-flex"
    >
      <input {...register} id={id} type="checkbox" className={checkBox} />
      {/* Check icon visible only when checked */}
      <svg
        viewBox="0 0 24 24"
        className={checkBoxSvg}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </label>
  );
}
