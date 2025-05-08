export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type IdField = {
  id?: string;
};

type TimestampFields = {
  created_at?: string;
  updated_at?: string;
};
export type SurveyRow = {
  id: string;
  title: string;
  questions: Json;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ResponseRow = {
  id: string;
  survey_id: string;
  answers: Json;
  created_at: string;
  respondent_id?: string;
};

export type UserRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      surveys: {
        Row: SurveyRow;
        Insert: Omit<SurveyRow, "id" | "created_at" | "updated_at"> &
          IdField &
          TimestampFields;
        Update: Partial<SurveyRow>;
      };
      responses: {
        Row: ResponseRow;
        Insert: Omit<ResponseRow, "id" | "created_at"> &
          IdField & { created_at?: string };
        Update: Partial<ResponseRow>;
      };
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, "id" | "created_at"> &
          IdField & {
            created_at?: string;
          };
        Update: Partial<UserRow>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
