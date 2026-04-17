import { format, formatDistanceToNow, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function formatCurrency(n: number | string): string {
  return currencyFormatter.format(Number(n));
}

export function formatDate(d: string): string {
  return format(parseISO(d), "MMM d, yyyy");
}

export function relativeTime(d: string): string {
  return formatDistanceToNow(parseISO(d), { addSuffix: true });
}
