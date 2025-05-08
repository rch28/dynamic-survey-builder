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
import type { ConditionalLogic, Question } from "@/types";

interface ConditionalLogicEditorProps {
  question: Question;
  questions: Question[];
  onChange: (question: Question) => void;
}

export function ConditionalLogicEditor({
  question,
  questions,
  onChange,
}: ConditionalLogicEditorProps) {
  const enableConditionalLogic = !!question.conditionalLogic?.dependsOn;

  const handleEnableChange = (checked: boolean) => {
    if (checked) {
      // Enable conditional logic with default values
      const firstQuestion = questions[0];
      onChange({
        ...question,
        conditionalLogic: {
          dependsOn: firstQuestion?.id,
          showWhen:
            firstQuestion?.type === "multiple-choice" ||
            firstQuestion?.type === "checkbox" ||
            firstQuestion?.type === "dropdown"
              ? [firstQuestion.options?.[0] || ""]
              : [],
        },
      });
    } else {
      // Disable conditional logic
      const { conditionalLogic, ...rest } = question;
      console.log("Conditional logic disabled", conditionalLogic);
      onChange(rest);
    }
  };

  const handleDependsOnChange = (questionId: string) => {
    const dependentQuestion = questions.find((q) => q.id === questionId);
    onChange({
      ...question,
      conditionalLogic: {
        dependsOn: questionId,
        showWhen:
          dependentQuestion?.type === "multiple-choice" ||
          dependentQuestion?.type === "checkbox" ||
          dependentQuestion?.type === "dropdown"
            ? [dependentQuestion.options?.[0] || ""]
            : [],
      },
    });
  };

  const handleShowWhenChange = (option: string, checked: boolean) => {
    const currentShowWhen = question.conditionalLogic?.showWhen || [];
    let newShowWhen: string[];

    if (checked) {
      newShowWhen = [...currentShowWhen, option];
    } else {
      newShowWhen = currentShowWhen.filter((item) => item !== option);
    }

    onChange({
      ...question,
      conditionalLogic: {
        ...(question.conditionalLogic as ConditionalLogic),
        showWhen: newShowWhen,
      },
    });
  };

  const dependentQuestion = questions.find(
    (q) => q.id === question.conditionalLogic?.dependsOn
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
              value={question.conditionalLogic?.dependsOn}
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

          {dependentQuestion &&
            (dependentQuestion.type === "multiple-choice" ||
              dependentQuestion.type === "checkbox" ||
              dependentQuestion.type === "dropdown") && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label>Show when answer is</Label>
                    <div className="space-y-2">
                      {dependentQuestion.options?.map((option) => (
                        <div
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`option-${option}`}
                            checked={(
                              question.conditionalLogic?.showWhen || []
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
