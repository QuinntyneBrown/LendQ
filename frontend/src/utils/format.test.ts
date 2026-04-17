import { describe, it, expect } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("renders a date-only string as the correct calendar day regardless of timezone (bug 2026-04-17-formatdate-timezone-off-by-one)", () => {
    // In timezones west of UTC, the old implementation rendered this as
    // "Apr 30, 2026" because `new Date("2026-05-01")` parses as UTC midnight
    // and then formats back in local time, subtracting the offset. A correct
    // implementation parses date-only strings as local dates.
    expect(formatDate("2026-05-01")).toBe("May 1, 2026");
  });

  it("handles a first-of-year date correctly", () => {
    expect(formatDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("handles a leap-day correctly", () => {
    expect(formatDate("2024-02-29")).toBe("Feb 29, 2024");
  });

  it("handles a last-of-year date correctly", () => {
    expect(formatDate("2026-12-31")).toBe("Dec 31, 2026");
  });
});
