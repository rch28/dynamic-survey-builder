import { z } from "zod";

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
  required: z.boolean().default(false).optional(),
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

// Survey Schema
export const surveySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Survey title is required"),
  description: z.string().optional(),
  questions: z.array(questionSchema),
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
export type Survey = z.infer<typeof surveySchema>;

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
