import { format, formatDistanceToNow } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

export function formatDate(d: string): string {
  return format(new Date(d), "MMM d, yyyy");
}

export function relativeTime(d: string): string {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}
