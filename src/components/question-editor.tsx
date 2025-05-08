"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Form } from "@/components/ui/form";
import { useQuestionForm } from "@/hooks/use-question-form";
import { useSurveyStore } from "@/store/survey-store";
import { hasOptions, isScaleQuestion } from "@/types/survey";

interface QuestionEditorProps {
  questionId: string;
}

export function QuestionEditor({ questionId }: QuestionEditorProps) {
  const [newOption, setNewOption] = useState("");
  const { form, onSubmit, currentQuestion } = useQuestionForm(questionId);
  const updateQuestion = useSurveyStore((state) => state.updateQuestion);

  if (!currentQuestion) {
    return <div>No question selected</div>;
  }

  const handleTitleChange = (value: string) => {
    if (currentQuestion) {
      updateQuestion({
        ...currentQuestion,
        title: value,
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (currentQuestion) {
      updateQuestion({
        ...currentQuestion,
        description: value,
      });
    }
  };

  const handleRequiredChange = (checked: boolean) => {
    if (currentQuestion) {
      updateQuestion({
        ...currentQuestion,
        required: checked,
      });
    }
  };

  const addOption = () => {
    if (!newOption.trim() || !hasOptions(currentQuestion)) return;

    const options = [...(currentQuestion.options || []), newOption.trim()];
    updateQuestion({
      ...currentQuestion,
      options,
    });
    setNewOption("");
  };

  const removeOption = (index: number) => {
    if (!hasOptions(currentQuestion)) return;

    const options = [...currentQuestion.options];
    options.splice(index, 1);
    updateQuestion({
      ...currentQuestion,
      options,
    });
  };

  const updateOption = (index: number, value: string) => {
    if (!hasOptions(currentQuestion)) return;

    const options = [...currentQuestion.options];
    options[index] = value;
    updateQuestion({
      ...currentQuestion,
      options,
    });
  };

  const updateScaleValue = (
    key: "min" | "max" | "minLabel" | "maxLabel",
    value: any
  ) => {
    if (!isScaleQuestion(currentQuestion)) return;

    updateQuestion({
      ...currentQuestion,
      [key]: value,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question-title">Question Text</Label>
          <Input
            id="question-title"
            value={currentQuestion.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter your question"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-description">Description (Optional)</Label>
          <Textarea
            id="question-description"
            value={currentQuestion.description || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description or instructions"
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="question-required"
            checked={currentQuestion.required}
            onCheckedChange={handleRequiredChange}
          />
          <Label htmlFor="question-required">Required question</Label>
        </div>

        {hasOptions(currentQuestion) && (
          <div className="space-y-3">
            <Label>Options</Label>

            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={currentQuestion.options.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove option</span>
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addOption}
                  className="h-8 w-8"
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add option</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {isScaleQuestion(currentQuestion) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Scale Range</Label>
              <div className="pt-4">
                <Slider
                  defaultValue={[currentQuestion.max as number]}
                  max={10}
                  min={1}
                  step={1}
                  onValueChange={(value) => updateScaleValue("max", value[0])}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentQuestion.min}</span>
                <span>{currentQuestion.max}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale-min-label">Min Label</Label>
                <Input
                  id="scale-min-label"
                  placeholder="Not at all likely"
                  value={currentQuestion.minLabel || ""}
                  onChange={(e) => updateScaleValue("minLabel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scale-max-label">Max Label</Label>
                <Input
                  id="scale-max-label"
                  placeholder="Extremely likely"
                  value={currentQuestion.maxLabel || ""}
                  onChange={(e) => updateScaleValue("maxLabel", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
