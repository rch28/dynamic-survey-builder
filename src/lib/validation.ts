import { z } from "zod";

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Common validation schemas
export const emailSchema = z
  .string()
  .email()
  .regex(EMAIL_REGEX, "Invalid email format");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters");

export const uuidSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const collaboratorRoleSchema = z.enum(["viewer", "editor", "owner"]);
// User profile schemas
export const updateProfileSchema = z.object({
  name: nameSchema,
  avatarUrl: z.string().optional(),
});

// Admin schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["user", "moderator", "admin"]).default("user"),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(["user", "moderator", "admin"]).optional(),
});

// Helper function to validate request data
export async function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

// Helper function to format validation errors
export function formatValidationErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
}
