import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  roles: z.array(z.string()).min(1),
  is_active: z.boolean(),
});

export type UserFormData = z.infer<typeof userSchema>;
