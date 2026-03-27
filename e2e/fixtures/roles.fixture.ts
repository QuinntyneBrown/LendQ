import { test as authTest } from "./auth.fixture";

export const USERS = {
  admin: { email: "admin@family.com", password: "password123", name: "Admin User" },
  creditor: { email: "creditor@family.com", password: "password123", name: "Quinn Brown" },
  borrower: { email: "borrower@family.com", password: "password123", name: "Sarah Williams" },
} as const;

export const test = authTest;
export { expect } from "@playwright/test";
