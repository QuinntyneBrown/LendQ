import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.number().positive().max(999999.99),
  date: z.string().min(1, "Payment date is required"),
  method: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const rescheduleSchema = z.object({
  new_date: z.string().min(1, "New date is required"),
  reason: z.string().max(2000).optional(),
});

export const pauseSchema = z.object({
  payment_ids: z.array(z.string()).min(1),
  reason: z.string().max(2000).optional(),
});

export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;
export type RescheduleFormData = z.infer<typeof rescheduleSchema>;
export type PauseFormData = z.infer<typeof pauseSchema>;
