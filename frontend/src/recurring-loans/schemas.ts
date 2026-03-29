import { z } from "zod";

export const createRecurringLoanSchema = z.object({
  borrower_id: z.string().min(1, "Borrower is required"),
  description_template: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters"),
  principal_amount: z
    .number({ required_error: "Principal is required", invalid_type_error: "Principal is required" })
    .positive("Principal must be positive")
    .max(999999.99, "Principal must be at most $999,999.99"),
  interest_rate_percent: z
    .number()
    .min(0, "Interest rate must be 0 or greater")
    .max(100, "Interest rate must be at most 100%")
    .optional()
    .nullable(),
  repayment_frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  installment_count: z
    .number({ required_error: "Installment count is required", invalid_type_error: "Installment count is required" })
    .int("Must be a whole number")
    .positive("Must be at least 1"),
  recurrence_interval: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  max_occurrences: z
    .number()
    .int("Must be a whole number")
    .positive("Must be at least 1")
    .optional()
    .nullable(),
});

export type CreateRecurringLoanFormData = z.infer<typeof createRecurringLoanSchema>;

export const updateRecurringLoanSchema = z.object({
  description_template: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters")
    .optional(),
  principal_amount: z
    .number()
    .positive("Principal must be positive")
    .max(999999.99, "Principal must be at most $999,999.99")
    .optional(),
  interest_rate_percent: z
    .number()
    .min(0, "Interest rate must be 0 or greater")
    .max(100, "Interest rate must be at most 100%")
    .optional()
    .nullable(),
  repayment_frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  installment_count: z
    .number()
    .int("Must be a whole number")
    .positive("Must be at least 1")
    .optional(),
  recurrence_interval: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  max_occurrences: z
    .number()
    .int("Must be a whole number")
    .positive("Must be at least 1")
    .optional()
    .nullable(),
  expected_version: z.number({ required_error: "Version is required" }),
});

export type UpdateRecurringLoanFormData = z.infer<typeof updateRecurringLoanSchema>;
