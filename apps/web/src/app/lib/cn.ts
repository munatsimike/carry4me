import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

export const inputStructural =
  "w-full h-10 px-2 rounded-md font-inter text-sm transition-colors focus:outline-none";

export const inputNeutral =
  "border border-neutral-400 hover:border-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30";

export const inputError =
  "border border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-400/30";

export const inputSuccess =
  "border border-success-500 focus:border-success-600 focus:ring-2 focus:ring-success-400/30";
