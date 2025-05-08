"use client";

import type React from "react";

import {
  ChevronDown,
  ListChecks,
  Calendar,
  BarChart3,
  CheckSquare,
  Type,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionType } from "@/types/survey";

interface QuestionTypeSelectorProps {
  onSelect: (type: QuestionType) => void;
}

export function QuestionTypeSelector({ onSelect }: QuestionTypeSelectorProps) {
  const questionTypes: {
    type: QuestionType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: QuestionType.TEXT,
      label: "Text",
      icon: <Type className="h-4 w-4" />,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      label: "Multiple Choice",
      icon: <ListChecks className="h-4 w-4" />,
    },
    {
      type: QuestionType.CHECKBOX,
      label: "Checkbox",
      icon: <CheckSquare className="h-4 w-4" />,
    },
    {
      type: QuestionType.DROPDOWN,
      label: "Dropdown",
      icon: <ChevronDown className="h-4 w-4" />,
    },
    {
      type: QuestionType.SCALE,
      label: "Scale",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: QuestionType.DATE,
      label: "Date",
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {questionTypes.map((item) => (
          <DropdownMenuItem
            key={item.type}
            onClick={() => onSelect(item.type)}
            className="flex items-center gap-2"
          >
            {item.icon}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
