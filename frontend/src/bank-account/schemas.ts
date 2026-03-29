import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999.99),
  reason_code: z.string().min(1, "Reason is required").max(50),
  description: z.string().max(500).optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999.99),
  reason_code: z.string().min(1, "Reason is required").max(50),
  description: z.string().max(500).optional(),
});

export const createRecurringDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  source_description: z.string().min(1, "Source description is required").max(255),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
});

export type DepositFormData = z.infer<typeof depositSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type CreateRecurringDepositFormData = z.infer<typeof createRecurringDepositSchema>;
