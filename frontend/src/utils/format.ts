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

/**
 * Parse an ISO date string as local midnight.
 *
 * `new Date("2026-12-31")` parses as UTC midnight and shifts to the previous
 * day in any timezone west of UTC. Use this for date-only fields (loan
 * start_date, payment due_date, savings deadline) when you need a `Date`
 * for comparisons or math and want it to land on the correct local day.
 */
export function parseDateOnly(d: string): Date {
  return parseISO(d);
}
