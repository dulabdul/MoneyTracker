import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current year, month, and date in WIB (Waktu Indonesia Barat / UTC+7).
 */
export function getCurrentWIBDate() {
  const nowUTC = new Date();
  const nowWIB = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
  return {
    year: nowWIB.getUTCFullYear(),
    month: nowWIB.getUTCMonth() + 1,
    date: nowWIB.getUTCDate()
  };
}
