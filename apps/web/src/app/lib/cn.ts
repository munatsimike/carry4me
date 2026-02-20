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
