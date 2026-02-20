import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for clean conditional Tailwind classes.
 * Usage: cn("base-class", condition && "conditional-class", { "another": isTrue })
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
