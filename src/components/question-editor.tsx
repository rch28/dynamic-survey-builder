"use client";

import type React from "react";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Question } from "@/types";
interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function QuestionEditor({ question, onChange }: QuestionEditorProps) {
  const [newOption, setNewOption] = useState<string>("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...question, title: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    onChange({ ...question, description: e.target.value });
  };

  const handleRequiredChange = (checked: boolean) => {
    onChange({ ...question, required: checked });
  };

  const addOption = () => {
    if (!newOption.trim()) return;

    const options = [...(question.options || []), newOption.trim()];
    onChange({ ...question, options });
    setNewOption("");
  };

  const removeOption = (index: number) => {
    const options = [...(question.options || [])];
    options.splice(index, 1);
    onChange({ ...question, options });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(question.options || [])];
    options[index] = value;
    onChange({ ...question, options });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question-title">Question Text</Label>
        <Input
          id="question-title"
          value={question.title}
          onChange={handleTitleChange}
          placeholder="Enter your question"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="question-description">Description (Optional)</Label>
        <Textarea
          id="question-description"
          value={question.description || ""}
          onChange={handleDescriptionChange}
          placeholder="Add a description or instructions"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="question-required"
          checked={question.required}
          onCheckedChange={handleRequiredChange}
        />
        <Label htmlFor="question-required">Required question</Label>
      </div>

      {(question.type === "multiple-choice" ||
        question.type === "checkbox" ||
        question.type === "dropdown") && (
        <div className="space-y-3">
          <Label>Options</Label>

          <div className="space-y-2">
            {question.options?.map((option, index) => (
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
                  disabled={question.options?.length === 1}
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

      {question.type === "scale" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Scale Range</Label>
            <div className="pt-4">
              <Slider defaultValue={[5]} max={10} min={1} step={1} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scale-min-label">Min Label</Label>
              <Input id="scale-min-label" placeholder="Not at all likely" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scale-max-label">Max Label</Label>
              <Input id="scale-max-label" placeholder="Extremely likely" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
