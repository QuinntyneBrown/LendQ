const PROTECTED_EMAILS = new Set(["admin@family.com", "creditor@family.com", "borrower@family.com"]);
const TEST_PATTERNS = ["test", "e2e"];
const TEST_DOMAINS = ["@family.com", "@lendq.local"];

export function isTestUser(email: string): boolean {
  const lower = email.toLowerCase();
  if (PROTECTED_EMAILS.has(lower)) return false;
  if (TEST_PATTERNS.some(p => lower.includes(p))) return true;
  if (TEST_DOMAINS.some(d => lower.endsWith(d))) return true;
  return false;
}
