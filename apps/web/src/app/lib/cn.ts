import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const baseInput = cn(
  "border border-neutral-200 font-inter text-sm text-ink-primary",
  "focus-within:ring-1 focus-within:ring-primary-100",
  "focus-within:border-primary-500",
  "focus:outline-none focus:ring-0",
);
