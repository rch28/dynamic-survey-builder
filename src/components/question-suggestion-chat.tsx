"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, MessageSquare } from "lucide-react";

import { useSurveyStore } from "@/store/survey-store";
import type { QuestionType } from "@/types/survey";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: SuggestedQuestion[];
}

interface SuggestedQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
}

export function QuestionSuggestionChat() {
  const addQuestion = useSurveyStore((state) => state.addQuestion);
  const updateQuestion = useSurveyStore((state) => state.updateQuestion);
  const selectQuestion = useSurveyStore((state) => state.selectQuestion);
  const questions = useSurveyStore((state) => state.survey.questions);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you create survey questions. What topic would you like questions about?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/grok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get suggestions");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Received invalid question data from the server");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Here are some suggested questions based on your topic:",
        suggestions: data.questions.map((q: any) => ({
          ...q,
          type: q.type as QuestionType,
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Error getting suggestions");

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I couldn't generate questions right now. Please try again or contact your administrator to check the API configuration.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddQuestion = (suggestion: SuggestedQuestion) => {
    // Add the question using the store
    addQuestion(suggestion.type);

    // Get the last added question
    const newQuestion = questions[questions.length - 1];

    // Update the question with the suggested content
    if (newQuestion) {
      updateQuestion({
        ...newQuestion,
        title: suggestion.question,
        options: suggestion.options || (newQuestion as any).options,
      });

      // Select the new question
      selectQuestion(newQuestion.id);
    }

    toast.success("Question added", {
      description: "The suggested question has been added to your survey.",
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Question Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === "assistant" ? "items-start" : "items-end"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p>{message.content}</p>
                </div>

                {message.suggestions && (
                  <div className="mt-2 space-y-2 w-full">
                    {message.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{suggestion.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {suggestion.type}
                          </p>
                          {suggestion.options && (
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground">
                                Options:
                              </p>
                              <ul className="text-xs pl-4">
                                {suggestion.options.map((option, i) => (
                                  <li key={i}>{option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => handleAddQuestion(suggestion)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Ask for question suggestions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
