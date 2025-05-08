"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Question, QuestionType } from "@/types/survey";

interface QuestionItemProps {
  question: Question;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function QuestionItem({
  question,
  isSelected,
  onClick,
  onRemove,
}: QuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.TEXT:
        return "Text";
      case QuestionType.MULTIPLE_CHOICE:
        return "Multiple Choice";
      case QuestionType.CHECKBOX:
        return "Checkbox";
      case QuestionType.DROPDOWN:
        return "Dropdown";
      case QuestionType.SCALE:
        return "Scale";
      case QuestionType.DATE:
        return "Date";
      default:
        return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 border rounded-md bg-background",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{question.title}</div>
        <div className="text-xs text-muted-foreground">
          {getQuestionTypeLabel(question.type)}
          {question.required && " • Required"}
          {question.conditionalLogic?.dependsOn && " • Conditional"}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove question</span>
      </Button>
    </div>
  );
}
