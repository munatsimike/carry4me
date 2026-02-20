import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const baseInput = cn(
  "border border-neutral-300 font-inter text-sm",
  "focus-within:ring-1 focus-within:ring-primary-00 hover:border-neutral-500",
  "focus:border-primary-500",
  "focus:outline-none focus:ring-0",
);

export const inputStructural =
  "w-full h-9 px-3 rounded-md font-inter text-sm transition-colors focus:outline-none border border-neutral-300 hover:border-neutral-400";
export const inputNeutral =
  "border border-neutral-300 hover:border-neutral-500 focus:border-primary-500";
export const inputError =
  "border border-error-400 focus:border-error-400";
export const inputSuccess =
  "border border-success-500 focus:border-success-500";
