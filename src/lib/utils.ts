import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a price number as Turkish Lira
export function formatPrice(price: number | string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

// Format a rating to one decimal place
export function formatRating(rating: number | string): string {
  return Number(rating).toFixed(1);
}

// Format a date string to Turkish locale
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
