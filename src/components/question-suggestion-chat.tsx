"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Loader2, MessageSquare, Plus, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Question, QuestionType } from "@/types";
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
interface QuestionSuggestionChatProps {
  onAddQuestion: (question: Partial<Question>) => void;
}
const QuestionSuggestionChat = ({
  onAddQuestion,
}: QuestionSuggestionChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you create survey questions. What topic would you like questions about?",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Here are some suggested questions based on your topic:",
        suggestions: data.questions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error(
        "Sorry, I couldn't generate questions right now. Please try again."
      );

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I couldn't generate questions right now. Please try again.",
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
    // Convert the suggested question to the format expected by the survey builder
    const newQuestion: Partial<Question> = {
      type: suggestion.type,
      title: suggestion.question,
      required: false,
      options: suggestion.options,
    };

    onAddQuestion(newQuestion);

    toast.success(
      `Added question: "${suggestion.question}" of type "${suggestion.type}"`
    );
  };
  return (
    <Card>
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
};

export default QuestionSuggestionChat;
