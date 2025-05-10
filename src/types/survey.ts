import { z } from "zod";
import { CollaboratorRole } from "./collaboration";

// Question Type Enum
export enum QuestionType {
  TEXT = "text",
  MULTIPLE_CHOICE = "multiple-choice",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  SCALE = "scale",
  DATE = "date",
}

// Base Question Schema
const baseQuestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Question text is required"),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

// Text Question Schema
export const textQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.TEXT),
});

// Options Question Schema (for multiple choice, checkbox, dropdown)
export const optionsQuestionSchema = baseQuestionSchema.extend({
  options: z.array(z.string()).min(1, "At least one option is required"),
});

// Multiple Choice Question Schema
export const multipleChoiceQuestionSchema = optionsQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
});

// Checkbox Question Schema
export const checkboxQuestionSchema = optionsQuestionSchema.extend({
  type: z.literal(QuestionType.CHECKBOX),
});

// Dropdown Question Schema
export const dropdownQuestionSchema = optionsQuestionSchema.extend({
  type: z.literal(QuestionType.DROPDOWN),
});

// Scale Question Schema
export const scaleQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.SCALE),
  min: z.number().default(1).optional(),
  max: z.number().default(10).optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

// Date Question Schema
export const dateQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.DATE),
});

// Conditional Logic Schema
export const conditionalLogicSchema = z.object({
  dependsOn: z.string(),
  showWhen: z.array(z.string()),
});

// Union of all question types
export const questionSchema = z
  .discriminatedUnion("type", [
    textQuestionSchema,
    multipleChoiceQuestionSchema,
    checkboxQuestionSchema,
    dropdownQuestionSchema,
    scaleQuestionSchema,
    dateQuestionSchema,
  ])
  .and(
    z.object({
      conditionalLogic: conditionalLogicSchema.optional(),
    })
  );

// Survey Metadata Schema
export const surveyMetadataSchema = z.object({
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowAnonymousResponses: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  estimatedCompletionTime: z.number().optional(),
});

// Survey Schema
export const surveySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Survey title is required"),
  description: z.string().optional(),
  questions: z.array(questionSchema),
  metadata: surveyMetadataSchema.default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  lastSavedAt: z.string().optional(),
  isDraft: z.boolean().default(true),
});

// Collaborator Schema
export const collaboratorSchema = z.object({
  id: z.string().optional(),
  surveyId: z.string(),
  userId: z.string(),
  role: z.nativeEnum(CollaboratorRole).default(CollaboratorRole.VIEWER),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      avatarUrl: z.string().optional(),
    })
    .optional(),
  created_at: z.string().optional(),
});
// Response Schema
export const responseSchema = z.object({
  id: z.string().optional(),
  surveyId: z.string(),
  respondentId: z.string().optional(),
  answers: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().optional(),
});
// Activity Log Schema
export const activityLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  createdAt: z.string().optional(),
  user: z
    .object({
      name: z.string(),
      email: z.string(),
    })
    .optional(),
});

// Visitor Schema
export const visitorSchema = z.object({
  id: z.string().optional(),
  surveyId: z.string(),
  visitorId: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  completed: z.boolean().default(false),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

// TypeScript types derived from Zod schemas
export type BaseQuestion = z.infer<typeof baseQuestionSchema>;
export type TextQuestion = z.infer<typeof textQuestionSchema>;
export type OptionsQuestion = z.infer<typeof optionsQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<
  typeof multipleChoiceQuestionSchema
>;
export type CheckboxQuestion = z.infer<typeof checkboxQuestionSchema>;
export type DropdownQuestion = z.infer<typeof dropdownQuestionSchema>;
export type ScaleQuestion = z.infer<typeof scaleQuestionSchema>;
export type DateQuestion = z.infer<typeof dateQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type ConditionalLogic = z.infer<typeof conditionalLogicSchema>;
export type SurveyMetadata = z.infer<typeof surveyMetadataSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type Collaborator = z.infer<typeof collaboratorSchema>;
export type Response = z.infer<typeof responseSchema>;
export type ActivityLog = z.infer<typeof activityLogSchema>;
export type Visitor = z.infer<typeof visitorSchema>;

// Type guard functions
export function isTextQuestion(question: Question): question is TextQuestion {
  return question.type === QuestionType.TEXT;
}

export function isMultipleChoiceQuestion(
  question: Question
): question is MultipleChoiceQuestion {
  return question.type === QuestionType.MULTIPLE_CHOICE;
}

export function isCheckboxQuestion(
  question: Question
): question is CheckboxQuestion {
  return question.type === QuestionType.CHECKBOX;
}

export function isDropdownQuestion(
  question: Question
): question is DropdownQuestion {
  return question.type === QuestionType.DROPDOWN;
}

export function isScaleQuestion(question: Question): question is ScaleQuestion {
  return question.type === QuestionType.SCALE;
}

export function isDateQuestion(question: Question): question is DateQuestion {
  return question.type === QuestionType.DATE;
}

export function hasOptions(
  question: Question
): question is Question & { options: string[] } {
  return ["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"].includes(question.type);
}

export function getOptionsQuestion(
  question: Question
): MultipleChoiceQuestion | CheckboxQuestion | DropdownQuestion | null {
  if (
    question.type === QuestionType.MULTIPLE_CHOICE ||
    question.type === QuestionType.CHECKBOX ||
    question.type === QuestionType.DROPDOWN
  ) {
    return question as
      | MultipleChoiceQuestion
      | CheckboxQuestion
      | DropdownQuestion;
  }
  return null;
}
