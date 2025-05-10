import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import type { Survey, Question } from "@/types/survey";
import { QuestionType } from "@/types/survey";

function createNewQuestion(type: QuestionType): Question {
  const base = {
    id: crypto.randomUUID(),
    title: `New ${type} question`,
    required: false,
  };

  switch (type) {
    case QuestionType.TEXT:
      return {
        ...base,
        type: QuestionType.TEXT,
      };

    case QuestionType.MULTIPLE_CHOICE:
      return {
        ...base,
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Option 1", "Option 2"], // Default options
      };

    case QuestionType.CHECKBOX:
      return {
        ...base,
        type: QuestionType.CHECKBOX,
        options: ["Option 1", "Option 2"], // Default options
      };

    case QuestionType.SCALE:
      return {
        ...base,
        type: QuestionType.SCALE,
        min: 1,
        max: 10,
        minLabel: "Not at all likely",
        maxLabel: "Extremely likely",
      };

    case QuestionType.DATE:
      return {
        ...base,
        type: QuestionType.DATE,
      };

    case QuestionType.DROPDOWN:
      return {
        ...base,
        type: QuestionType.DROPDOWN,
        options: ["Select 1", "Select 2"], // Default options
      };

    default:
      throw new Error("Unsupported question type");
  }
}

// Define the history state for undo/redo

// Define the survey store state
interface SurveyState {
  survey: Survey;
  selectedQuestionId: string | null;
  isDirty: boolean;
}

// Define the survey store actions
interface SurveyActions {
  // Survey actions
  setSurvey: (survey: Survey) => void;
  updateSurveyTitle: (title: string) => void;
  updateSurveyDescription: (description: string) => void;

  // Question actions
  addQuestion: (type: QuestionType) => void;
  updateQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;

  // Selection actions
  selectQuestion: (id: string | null) => void;

  // State management
  markAsSaved: () => void;
  resetState: () => void;
}

// Create the initial survey
const createInitialSurvey = (): Survey => ({
  title: "Untitled Survey",
  description: "",
  questions: [],
});

// Create the initial state
const initialState: SurveyState = {
  survey: createInitialSurvey(),
  selectedQuestionId: null,
  isDirty: false,
};

// Create the store
export const useSurveyStore = create<SurveyState & SurveyActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Survey actions
      setSurvey: (survey) => {
        set({
          survey,
          selectedQuestionId: null,
          isDirty: false,
        });
      },

      updateSurveyTitle: (title) => {
        set(
          produce((state: SurveyState) => {
            state.survey.title = title;
            state.isDirty = true;
          })
        );
      },

      updateSurveyDescription: (description) => {
        set(
          produce((state: SurveyState) => {
            state.survey.description = description;
            state.isDirty = true;
          })
        );
      },

      // Question actions
      addQuestion: (type) => {
        const newQuestion: Question = createNewQuestion(type);
        set(
          produce((state: SurveyState) => {
            state.survey.questions.push(newQuestion);
            state.selectedQuestionId = newQuestion.id;
            state.isDirty = true;
          })
        );
      },

      updateQuestion: (question) => {
        set(
          produce((state: SurveyState) => {
            const index = state.survey.questions.findIndex(
              (q) => q.id === question.id
            );
            if (index !== -1) {
              state.survey.questions[index] = question;
              state.isDirty = true;
            }
          })
        );
      },

      removeQuestion: (id) => {
        set(
          produce((state: SurveyState) => {
            state.survey.questions = state.survey.questions.filter(
              (q) => q.id !== id
            );

            // Also remove any conditional logic that depends on this question
            state.survey.questions.forEach((q) => {
              if (q.conditionalLogic?.dependsOn === id) {
                delete q.conditionalLogic;
              }
            });

            if (state.selectedQuestionId === id) {
              state.selectedQuestionId = null;
            }

            state.isDirty = true;
          })
        );
      },

      reorderQuestions: (startIndex, endIndex) => {
        set(
          produce((state: SurveyState) => {
            const [removed] = state.survey.questions.splice(startIndex, 1);
            state.survey.questions.splice(endIndex, 0, removed);
            state.isDirty = true;
          })
        );
      },

      // Selection actions
      selectQuestion: (id) => {
        set({ selectedQuestionId: id });
      },

      // State management
      markAsSaved: () => {
        set({ isDirty: false });
      },

      resetState: () => {
        set(initialState);
      },
    }),
    {
      name: "survey-builder-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        survey: state.survey,
        // Don't persist selection state or history
      }),
    }
  )
);
