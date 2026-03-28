import path from "node:path";

export const AUTH_STATE_DIR = path.resolve(".auth");

export const AUTH_STORAGE_STATE = {
  admin: path.join(AUTH_STATE_DIR, "admin.json"),
  creditor: path.join(AUTH_STATE_DIR, "creditor.json"),
  borrower: path.join(AUTH_STATE_DIR, "borrower.json"),
} as const;
