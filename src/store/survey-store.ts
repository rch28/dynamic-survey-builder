import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import type {
  Survey,
  Question,
  SurveyMetadata,
  Collaborator,
} from "@/types/survey";
import { QuestionType } from "@/types/survey";
import type { CollaboratorRole } from "@/types/collaboration";

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

// Define a draft State
interface DraftState {
  drafts: Record<string, Survey>;
}

// Define the survey store state
interface SurveyState {
  survey: Survey;
  selectedQuestionId: string | null;
  isDirty: boolean;
  drafts: DraftState;
  collaborators: Collaborator[];
}

// Define the survey store actions
interface SurveyActions {
  // Survey actions
  setSurvey: (survey: Survey) => void;
  updateSurveyTitle: (title: string) => void;
  updateSurveyDescription: (description: string) => void;
  updateSurveyMetadata: (metadata: Partial<SurveyMetadata>) => void;

  // Question actions
  addQuestion: (type: QuestionType) => void;
  updateQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;

  // Selection actions
  selectQuestion: (id: string | null) => void;

  // draft actions
  saveDraft: () => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  getDrafts: () => Survey[];

  // Collaborator Actions
  setCollaborators: (collaborators: Collaborator[]) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  updateCollaborator: (id: string, role: CollaboratorRole) => void;
  removeCollaborator: (id: string) => void;
  // State management
  markAsSaved: () => void;
  resetState: () => void;
}

// Create the initial survey
const createInitialSurvey = (): Survey => ({
  title: "Untitled Survey",
  description: "",
  questions: [],
  metadata: {
    tags: [],
    isPublic: false,
    allowAnonymousResponses: true,
  },
  isDraft: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Create the initial state
const initialState: SurveyState = {
  survey: createInitialSurvey(),
  selectedQuestionId: null,
  isDirty: false,
  drafts: {
    drafts: {},
  },
  collaborators: [],
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
            state.survey.updated_at = new Date().toISOString();
            state.isDirty = true;
          })
        );
      },

      updateSurveyDescription: (description) => {
        set(
          produce((state: SurveyState) => {
            state.survey.description = description;
            state.survey.updated_at = new Date().toISOString();
            state.isDirty = true;
          })
        );
      },
      // update survey metadata
      updateSurveyMetadata: (metadata) => {
        set(
          produce((state: SurveyState) => {
            state.survey.metadata = { ...state.survey.metadata, ...metadata };
            state.survey.updated_at = new Date().toISOString();
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
            state.survey.updated_at = new Date().toISOString();
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
              state.survey.updated_at = new Date().toISOString();
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
            state.survey.updated_at = new Date().toISOString();
            state.isDirty = true;
          })
        );
      },

      reorderQuestions: (startIndex, endIndex) => {
        set(
          produce((state: SurveyState) => {
            const [removed] = state.survey.questions.splice(startIndex, 1);
            state.survey.questions.splice(endIndex, 0, removed);
            state.survey.updated_at = new Date().toISOString();
            state.isDirty = true;
          })
        );
      },

      // Selection actions
      selectQuestion: (id) => {
        set({ selectedQuestionId: id });
      },
      // Draft actions
      saveDraft: () => {
        set(
          produce((state: SurveyState) => {
            const currentSurvey = { ...state.survey };
            const draftId = currentSurvey.id || crypto.randomUUID();

            // update the survey with the draft id
            currentSurvey.id = draftId;
            currentSurvey.isDraft = true;
            currentSurvey.lastSavedAt = new Date().toISOString();
            currentSurvey.updated_at = new Date().toISOString();

            // save the draft
            state.drafts.drafts[draftId] = currentSurvey;

            // update the survey state
            state.survey = currentSurvey;
            state.isDirty = false;
          })
        );
      },

      // load draft
      loadDraft: (id) => {
        const { drafts } = get().drafts;
        const draft = drafts[id];

        if (draft) {
          set({
            survey: draft,
            selectedQuestionId: null,
            isDirty: false,
          });
        }
      },

      deleteDraft: (id) => {
        set(
          produce((state: SurveyState) => {
            const drafts = { ...state.drafts.drafts };
            delete drafts[id];
            state.drafts.drafts = drafts;
          })
        );
      },
      getDrafts: () => {
        const { drafts } = get().drafts;
        return Object.values(drafts);
      },

      // Collaboration actions
      setCollaborators: (collaborators) => {
        set({ collaborators });
      },

      addCollaborator: (collaborator) => {
        set(
          produce((state) => {
            state.collaborators.push(collaborator);
          })
        );
      },
      updateCollaborator: (id, role) => {
        set(
          produce((state: SurveyState) => {
            const index = state.collaborators.findIndex((c) => c.id === id);
            if (index !== -1) {
              state.collaborators[index].role = role;
            }
          })
        );
      },
      removeCollaborator: (id) => {
        set(
          produce((state: SurveyState) => {
            state.collaborators = state.collaborators.filter(
              (c) => c.id !== id
            );
          })
        );
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
