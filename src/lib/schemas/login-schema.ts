import { z } from "zod";
import { emailSchema } from "../validation";

export const loginSchema = z.object({
  email: emailSchema.min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const loginDefaultValues: LoginSchema = {
  email: "",
  password: "",
};
