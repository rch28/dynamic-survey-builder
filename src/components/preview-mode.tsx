import { useState } from "react";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import type { ResponseAnswer } from "@/types";
import { Question } from "@/types/survey";

interface PreviewModeProps {
  title: string;
  questions: Question[];
  // onSubmit?: (answers: Record<string, ResponseAnswer>) => Promise<boolean>;
}

const PreviewMode = ({ title, questions }: PreviewModeProps) => {
  const [answers, setAnswers] = useState<Record<string, ResponseAnswer>>({});
  // handle text input change
  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };
  const handleMultipleChoiceChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };
  const handleCheckboxChange = (
    questionId: string,
    option: string,
    checked: boolean
  ) => {
    const currentValues = (answers[questionId] as string[]) || [];
    let newValues: string[];
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter((item) => item !== option);
    }
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: newValues,
    }));
  };
  const handleScaleChange = (questionId: string, value: number[]) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value[0],
    }));
  };
  const handleDateChange = (questionId: string, date: Date | undefined) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: date || null,
    }));
  };

  const shouldShowQuestion = (question: Question): boolean => {
    if (!question.conditionalLogic?.dependsOn) return true;
    const dependsOn = question.conditionalLogic.dependsOn;
    const showWhen = question.conditionalLogic.showWhen || [];
    const dependentAnswer = answers[dependsOn];

    if (!dependentAnswer) {
      return false;
    }
    if (Array.isArray(dependentAnswer)) {
      // for checkbox or multiple-choice questions
      return dependentAnswer.some((answer) => showWhen.includes(answer));
    } else {
      // for single-choice questions
      return showWhen.includes(dependentAnswer as string);
    }
  };
  const visibleQuestions = questions.filter(shouldShowQuestion);
  // handle form submission
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted");
  };
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">Preview Mode</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {visibleQuestions.map((question) => (
          <div key={question.id} className="border p-4 rounded-md">
            <div className="space-y-2 mb-4">
              <div className="font-medium">
                {question.title}
                {question.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </div>
              {question.description && (
                <p className="text-sm text-muted-foreground">
                  {question.description}
                </p>
              )}
            </div>
            {question.type === "text" && (
              <Input
                value={(answers[question.id] as string) || ""}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Type your answer here"
                required={question.required}
              />
            )}
            {question.type === "multiple-choice" && (
              <RadioGroup
                value={(answers[question.id] as string) || ""}
                onValueChange={(value) =>
                  handleMultipleChoiceChange(question.id, value)
                }
                required={question.required}
              >
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`${question.id}-${option}`}
                      />
                      <Label htmlFor={`${question.id}-${option}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {question.type === "checkbox" && (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-${option}`}
                      checked={(
                        (answers[question.id] as string[]) || []
                      ).includes(option)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          question.id,
                          option,
                          checked === true
                        )
                      }
                      required={
                        question.required &&
                        ((answers[question.id] as string[]) || []).length === 0
                      }
                    />
                    <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </div>
            )}
            {question.type === "dropdown" && (
              <Select
                value={(answers[question.id] as string) || ""}
                onValueChange={(value) =>
                  handleMultipleChoiceChange(question.id, value)
                }
                required={question.required}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {question.type === "scale" && (
              <div className="space-y-4">
                <Slider
                  value={
                    answers[question.id]
                      ? [answers[question.id] as number]
                      : [5]
                  }
                  onValueChange={(value) =>
                    handleScaleChange(question.id, value)
                  }
                  max={10}
                  min={1}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}
            {question.type === "date" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !answers[question.id] && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {answers[question.id]
                      ? format(answers[question.id] as Date, "PPP")
                      : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={answers[question.id] as Date | undefined}
                    onSelect={(date) => handleDateChange(question.id, date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              alert(
                "This is just a preview. In a real survey, this would navigate to the previous page."
              )
            }
          >
            Previous
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};
export default PreviewMode;
