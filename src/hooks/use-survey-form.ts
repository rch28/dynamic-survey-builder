"use client";

import { useForm } from "react-hook-form";
import { useSurveyStore } from "@/store/survey-store";
import { surveySchema, type Survey } from "@/types/survey";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export function useSurveyForm() {
  const survey = useSurveyStore((state) => state.survey);
  const updateSurveyTitle = useSurveyStore((state) => state.updateSurveyTitle);
  const updateSurveyDescription = useSurveyStore(
    (state) => state.updateSurveyDescription
  );

  const isDirty = useSurveyStore((state) => state.isDirty);
  const markAsSaved = useSurveyStore((state) => state.markAsSaved);
  // Initialize the form with the current survey data
  const form = useForm<Survey>({
    defaultValues: survey,
  });

  // Update the form when the survey changes
  useEffect(() => {
    form.reset(survey);
  }, [survey, form]);

  // Handle form submission
  const onSubmit = async (data: Survey) => {
    try {
      // Update the survey title and description
      updateSurveyTitle(data.title);
      if (data.description) {
        updateSurveyDescription(data.description);
      }

      // Mark the survey as saved
      markAsSaved();

      return true;
    } catch (error) {
      console.error("Error saving survey:", error);
      return false;
    }
  };

  return {
    form,
    onSubmit,
    isDirty,
  };
}
