import { useSurveyStore } from "@/store/survey-store";
import { useShallow } from "zustand/react/shallow";

// Convenience hook for getting survey data
export function useSurvey() {
  return useSurveyStore(
    useShallow((state) => ({
      survey: state.survey,
      title: state.survey.title,
      description: state.survey.description,
      questions: state.survey.questions,
      isDirty: state.isDirty,
      updateTitle: state.updateSurveyTitle,
      updateDescription: state.updateSurveyDescription,
      markAsSaved: state.markAsSaved,
      setSurvey: state.setSurvey,
    }))
  );
}

// Convenience hook for working with questions
export function useQuestions() {
  return useSurveyStore(
    useShallow((state) => ({
      questions: state.survey.questions,
      selectedId: state.selectedQuestionId,
      selectedQuestion: state.selectedQuestionId
        ? state.survey.questions.find((q) => q.id === state.selectedQuestionId)
        : null,
      select: state.selectQuestion,
      add: state.addQuestion,
      update: state.updateQuestion,
      remove: state.removeQuestion,
      reorder: state.reorderQuestions,
    }))
  );
}
