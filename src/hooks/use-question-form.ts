"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSurveyStore } from "@/store/survey-store";
import { questionSchema, type Question } from "@/types/survey";
import { useEffect } from "react";

export function useQuestionForm(questionId: string | null) {
  const questions = useSurveyStore((state) => state.survey.questions);
  const updateQuestion = useSurveyStore((state) => state.updateQuestion);

  // Find the current question
  const currentQuestion = questionId
    ? questions.find((q) => q.id === questionId)
    : null;

  // Initialize the form with the current question data
  const form = useForm<Question>({
    resolver: zodResolver(questionSchema),
    defaultValues: currentQuestion || undefined,
  });

  // Update the form when the question changes
  useEffect(() => {
    if (currentQuestion) {
      form.reset(currentQuestion);
    } else {
      form.reset({} as Question);
    }
  }, [currentQuestion, form]);

  // Handle form submission
  const onSubmit = async (data: Question) => {
    try {
      if (currentQuestion) {
        updateQuestion(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating question:", error);
      return false;
    }
  };

  return {
    form,
    onSubmit,
    currentQuestion,
  };
}
