import { z } from "zod";
import { emailSchema, nameSchema, passwordSchema } from "../validation";

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema.min(1, "Email is required"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

export const registerDefaultValues: RegisterSchema = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
