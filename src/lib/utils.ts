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

// Format a date as a Turkish relative string ("2 gün önce", "1 hafta önce", etc.)
// Falls back to formatDate for dates older than a year.
export function formatRelativeDate(dateString: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 86_400_000
  );
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 hafta önce";
  if (weeks < 5) return `${weeks} hafta önce`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 ay önce";
  if (months < 12) return `${months} ay önce`;
  return formatDate(dateString);
}
