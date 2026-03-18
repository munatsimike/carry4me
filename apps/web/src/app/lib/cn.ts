import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

export const inputStructural =
  "w-full h-10 px-2 rounded-md font-inter text-sm transition-colors focus:outline-none";

export const inputNeutral =
  "border border-slate-300 hover:border-primary-500 " +
  "focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/40";

export const inputError =
  "border border-error-400 hover:border-error-500 " +
  "focus-within:border-error-500 focus-within:ring-2 focus-within:ring-error-400/40";

export const inputSuccess =
  "border border-success-500 hover:border-success-600 " +
  "focus-within:border-success-500 focus-within:ring-2 focus-within:ring-success-400/40";

export const dialogIconStyle = "h-6 w-6 text-primary-400";

export const checkBox =
  "peer appearance-none w-4 h-4 rounded-[4px] border border-gray-300 bg-white transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 checked:bg-primary-500 checked:border-primary-500";

export const checkBoxSvg =
  "pointer-events-none absolute inset-0 m-auto w-4 h-4 text-white opacity-0 transition peer-checked:opacity-100";
