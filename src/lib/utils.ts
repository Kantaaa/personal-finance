import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "NOK"): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("nb-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
