import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "UZS"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 " + currency;
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(num) + " " + currency;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food & Dining",
  RENT: "Rent",
  UTILITIES: "Utilities",
  ENTERTAINMENT: "Entertainment",
  TRANSPORT: "Transport",
  HEALTHCARE: "Healthcare",
  SHOPPING: "Shopping",
  TRAVEL: "Travel",
  OTHER: "Other",
};

export const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#f97316",
  RENT: "#8b5cf6",
  UTILITIES: "#0ea5e9",
  ENTERTAINMENT: "#ec4899",
  TRANSPORT: "#14b8a6",
  HEALTHCARE: "#ef4444",
  SHOPPING: "#f59e0b",
  TRAVEL: "#10b981",
  OTHER: "#6b7280",
};

export const GROUP_TYPE_LABELS: Record<string, string> = {
  FLATMATES: "Flatmates",
  COWORKERS: "Co-workers",
  FRIENDS: "Friends",
  TRIP: "Trip",
  FAMILY: "Family",
  OTHER: "Other",
};
