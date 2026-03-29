import { z } from "zod";

export const createAccountSchema = z.object({
  user_id: z.string().min(1),
  currency: z.string().min(1),
  initial_deposit: z.number().min(0),
  note: z.string().max(500).optional(),
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export const changeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN", "CLOSED"]),
  reason: z.string().min(1, "Reason is required").max(500),
});

export type ChangeStatusFormData = z.infer<typeof changeStatusSchema>;
