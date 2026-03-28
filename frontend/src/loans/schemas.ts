import { z } from "zod";

export const createLoanSchema = z.object({
  borrower_id: z.string().min(1, "Borrower is required"),
  description: z.string().min(3, "Description must be at least 3 characters").max(500, "Description must be at most 500 characters"),
  principal: z.number({ error: "Principal is required" }).positive("Principal must be positive").max(999999.99, "Principal must be at most $999,999.99"),
  interest_rate: z.number().min(0).max(100).optional(),
  repayment_frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  start_date: z.string().min(1, "Start date is required"),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional(),
});

export type CreateLoanFormData = z.infer<typeof createLoanSchema>;
