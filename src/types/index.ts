// Question Types
export type QuestionType =
  | "text"
  | "multiple-choice"
  | "checkbox"
  | "dropdown"
  | "scale"
  | "date";

export interface ConditionalLogic {
  dependsOn: string;
  showWhen: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
}

// Survey Types
export interface Survey {
  id: string;
  title: string;
  questions: Question[];
  published: boolean;
  created_at: string;
  updated_at: string;
  userId: string;
  _count?: {
    responses: number;
  };
}

// Response Types
export interface SurveyResponse {
  id: string;
  answers: Record<string, ResponseAnswer>;
  created_at: string;
  surveyId: string;
}

export type ResponseAnswer = string | string[] | number | Date | null;

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface SurveyApiResponse {
  survey: Survey;
}

export interface SurveysApiResponse {
  surveys: Survey[];
}

export interface ResponseApiResponse {
  response: SurveyResponse;
}
