"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSurveyStore } from "@/store/survey-store";
import { hasOptions, type Question } from "@/types/survey";

interface ConditionalLogicEditorProps {
  questionId: string;
  questions: Question[];
}

export function ConditionalLogicEditor({
  questionId,
  questions,
}: ConditionalLogicEditorProps) {
  const updateQuestion = useSurveyStore((state) => state.updateQuestion);
  const currentQuestion = useSurveyStore((state) =>
    state.survey.questions.find((q) => q.id === questionId)
  );

  if (!currentQuestion) {
    return null;
  }

  const enableConditionalLogic = !!currentQuestion.conditionalLogic?.dependsOn;

  const handleEnableChange = (checked: boolean) => {
    if (checked) {
      // Enable conditional logic with default values
      const firstQuestion = questions[0];
      updateQuestion({
        ...currentQuestion,
        conditionalLogic: {
          dependsOn: firstQuestion?.id,
          showWhen: hasOptions(firstQuestion)
            ? [firstQuestion.options[0] || ""]
            : [],
        },
      });
    } else {
      // Disable conditional logic
      const { conditionalLogic, ...rest } = currentQuestion;
      updateQuestion(rest);
    }
  };

  const handleDependsOnChange = (questionId: string) => {
    const dependentQuestion = questions.find((q) => q.id === questionId);
    if (!dependentQuestion) return;

    updateQuestion({
      ...currentQuestion,
      conditionalLogic: {
        dependsOn: questionId,
        showWhen: hasOptions(dependentQuestion)
          ? [dependentQuestion.options[0] || ""]
          : [],
      },
    });
  };

  const handleShowWhenChange = (option: string, checked: boolean) => {
    if (!currentQuestion.conditionalLogic) return;

    const currentShowWhen = currentQuestion.conditionalLogic.showWhen || [];
    let newShowWhen: string[];

    if (checked) {
      newShowWhen = [...currentShowWhen, option];
    } else {
      newShowWhen = currentShowWhen.filter((item) => item !== option);
    }

    updateQuestion({
      ...currentQuestion,
      conditionalLogic: {
        ...currentQuestion.conditionalLogic,
        showWhen: newShowWhen,
      },
    });
  };

  const dependentQuestion = questions.find(
    (q) => q.id === currentQuestion.conditionalLogic?.dependsOn
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="enable-conditional"
          checked={enableConditionalLogic}
          onCheckedChange={handleEnableChange}
        />
        <Label htmlFor="enable-conditional">Enable conditional logic</Label>
      </div>

      {enableConditionalLogic && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depends-on">
              Show this question based on the answer to
            </Label>
            <Select
              value={currentQuestion.conditionalLogic?.dependsOn}
              onValueChange={handleDependsOnChange}
            >
              <SelectTrigger id="depends-on">
                <SelectValue placeholder="Select a question" />
              </SelectTrigger>
              <SelectContent>
                {questions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dependentQuestion && hasOptions(dependentQuestion) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Show when answer is</Label>
                  <div className="space-y-2">
                    {dependentQuestion.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${option}`}
                          checked={(
                            currentQuestion.conditionalLogic?.showWhen || []
                          ).includes(option)}
                          onCheckedChange={(checked) =>
                            handleShowWhenChange(option, checked === true)
                          }
                        />
                        <Label htmlFor={`option-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!enableConditionalLogic && (
        <p className="text-sm text-muted-foreground">
          This question will always be shown to respondents.
        </p>
      )}
    </div>
  );
}
