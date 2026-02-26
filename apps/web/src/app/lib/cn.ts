import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

export const inputStructural =
  "w-full h-10 px-2 rounded-md font-inter text-sm transition-colors focus:outline-none";

export const inputNeutral =
  "border border-neutral-400 hover:border-primary-500 " +
  "focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/40";

export const inputError =
  "border border-error-400 hover:border-error-500 " +
  "focus-within:border-error-500 focus-within:ring-2 focus-within:ring-error-400/40";

export const inputSuccess =
  "border border-success-400 hover:border-success-500 " +
  "focus-within:border-success-500 focus-within:ring-2 focus-within:ring-success-400/40";
