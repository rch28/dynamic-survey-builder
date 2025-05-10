"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSurveyStore } from "@/store/survey-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SurveyMetadata() {
  const survey = useSurveyStore((state) => state.survey);
  const updateMetadata = useSurveyStore((state) => state.updateSurveyMetadata);

  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !survey.metadata.tags.includes(newTag.trim())) {
      updateMetadata({
        tags: [...survey.metadata.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateMetadata({
      tags: survey.metadata.tags.filter((t) => t !== tag),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const categories = [
    "Customer Feedback",
    "Market Research",
    "Employee Satisfaction",
    "Event Planning",
    "Education",
    "Healthcare",
    "Other",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {survey.metadata.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={survey.metadata.category || ""}
            onValueChange={(value) => updateMetadata({ category: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="public-switch">Public Survey</Label>
            <p className="text-sm text-muted-foreground">
              Make this survey accessible to anyone with the link
            </p>
          </div>
          <Switch
            id="public-switch"
            checked={survey.metadata.isPublic}
            onCheckedChange={(checked) => updateMetadata({ isPublic: checked })}
          />
        </div>

        {/* Anonymous Responses */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="anonymous-switch">Allow Anonymous Responses</Label>
            <p className="text-sm text-muted-foreground">
              Collect responses without requiring user identification
            </p>
          </div>
          <Switch
            id="anonymous-switch"
            checked={survey.metadata.allowAnonymousResponses}
            onCheckedChange={(checked) =>
              updateMetadata({ allowAnonymousResponses: checked })
            }
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !survey.metadata.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {survey.metadata.startDate
                    ? format(new Date(survey.metadata.startDate), "PPP")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    survey.metadata.startDate
                      ? new Date(survey.metadata.startDate)
                      : undefined
                  }
                  onSelect={(date) => updateMetadata({ startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !survey.metadata.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {survey.metadata.endDate
                    ? format(new Date(survey.metadata.endDate), "PPP")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    survey.metadata.endDate
                      ? new Date(survey.metadata.endDate)
                      : undefined
                  }
                  onSelect={(date) => updateMetadata({ endDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Estimated Completion Time */}
        <div className="space-y-2">
          <Label htmlFor="completion-time">
            Estimated Completion Time (minutes)
          </Label>
          <Input
            id="completion-time"
            type="number"
            min="1"
            value={survey.metadata.estimatedCompletionTime || ""}
            onChange={(e) =>
              updateMetadata({
                estimatedCompletionTime: e.target.value
                  ? Number.parseInt(e.target.value)
                  : undefined,
              })
            }
            placeholder="e.g., 5"
          />
        </div>
      </CardContent>
    </Card>
  );
}
