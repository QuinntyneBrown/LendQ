import { z } from "zod";

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  target_amount: z.number({ required_error: "Target amount is required" }).positive("Target amount must be positive").max(999999999.99, "Target amount is too large"),
  deadline: z.string().optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
});

export type CreateSavingsGoalFormData = z.infer<typeof createSavingsGoalSchema>;

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters").optional(),
  target_amount: z.number().positive("Target amount must be positive").max(999999999.99, "Target amount is too large").optional(),
  deadline: z.string().nullable().optional(),
  description: z.string().max(500, "Description must be at most 500 characters").nullable().optional(),
  expected_version: z.number({ required_error: "Version is required" }),
});

export type UpdateSavingsGoalFormData = z.infer<typeof updateSavingsGoalSchema>;

export const contributeSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be positive").max(999999999.99, "Amount is too large"),
  account_id: z.string().min(1, "Account is required"),
});

export type ContributeFormData = z.infer<typeof contributeSchema>;

export const releaseSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be positive").max(999999999.99, "Amount is too large"),
  account_id: z.string().min(1, "Account is required"),
});

export type ReleaseFormData = z.infer<typeof releaseSchema>;
