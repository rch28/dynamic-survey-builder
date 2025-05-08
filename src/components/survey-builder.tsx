"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Download,
  Link2,
  MessageSquare,
  Plus,
  Save,
  Upload,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { QuestionTypeSelector } from "./question-type-selector";
import QuestionItem from "./question-item";
import { QuestionEditor } from "./question-editor";
import { ConditionalLogicEditor } from "./conditonal-login-editor";
import PreviewMode from "./preview-mode";
import QuestionSuggestionChat from "./question-suggestion-chat";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import type { Question, QuestionType, Survey } from "@/types";

interface SurveyBuilderProps {
  initialSurvey?: Survey | null;
}

const SurveyBuilder = ({ initialSurvey = null }: SurveyBuilderProps) => {
  const [questions, setQuestions] = useState<Question[]>(
    initialSurvey?.questions || []
  );
  const [surveyTitle, setSurveyTitle] = useState<string>(
    initialSurvey?.title || "Untitled Survey"
  );
  const [surveyId, setSurveyId] = useState<string | null>(
    initialSurvey?.id || null
  );
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  // const [isPublished, setIsPublished] = useState<boolean>(
  //   initialSurvey?.published || false
  // );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (initialSurvey) {
      setQuestions(initialSurvey.questions || []);
      setSurveyTitle(initialSurvey.title || "Untitled Survey");
      setSurveyId(initialSurvey.id || null);
      // setIsPublished(initialSurvey.published || false);
    }
  }, [initialSurvey]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  // add a question
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type,
      title: `New ${type} Question`,
      required: false,
      options:
        type === "multiple-choice" || type === "checkbox" || type === "dropdown"
          ? ["Option 1", "Option 2"]
          : undefined,
      conditionalLogic: undefined,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setSelectedQuestion(newQuestion);
  };
  // update question
  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
    setSelectedQuestion(updatedQuestion);
  };
  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
    if (selectedQuestion?.id === id) {
      setSelectedQuestion(null);
    }
    // Also remove any conditional logic that depends on this question
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.conditionalLogic?.dependsOn === id) {
          const { conditionalLogic, ...rest } = q;
          console.log(conditionalLogic);
          return rest;
        }
        return q;
      })
    );
  };
  // import survey data from a JSON file
  const importSurvey = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const surveyData = JSON.parse(data);
        if (surveyData.title && Array.isArray(surveyData.questions)) {
          setSurveyTitle(surveyData.title);
          setQuestions(surveyData.questions);
        }
      } catch (e) {
        console.error("Error parsing JSON file", e);
        alert("Failed to import survey. The file format is invalid.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset the input value
  };
  // export survey data to a JSON file
  const exportSurvey = () => {
    // get survey data
    const surveyData = {
      title: surveyTitle,
      questions,
    };
    const dataStr = JSON.stringify(surveyData, null, 2);

    const blob = new Blob([dataStr], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const defaultFileName = `${surveyTitle.replace(/\s+/g, "_")}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", url);
    linkElement.setAttribute("download", defaultFileName);
    linkElement.click();
    URL.revokeObjectURL(url);
  };
  // save survey
  const saveSurvey = async (): Promise<Survey | null> => {
    if (!user) {
      toast.success("Authentication required", {
        description: "Please login to save your survey",
      });
      router.push("/login");
      return null;
    }

    try {
      setIsSaving(true);
      const surveyData = {
        title: surveyTitle,
        questions,
      };

      const url = surveyId ? `/api/surveys/${surveyId}` : "/api/surveys";
      const method = surveyId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(surveyData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Survey saved", {
          description: "Your survey has been saved successfully",
        });

        if (!surveyId) {
          setSurveyId(data?.survey?.id);
          // Update URL without refreshing the page
          window.history.pushState({}, "", `/builder/${data?.survey?.id}`);
        }

        return data.survey;
      } else {
        throw new Error("Failed to save survey!");
      }
    } catch (error) {
      console.error(error || "Save survey error:", error);
      toast.error("Failed to save survey", {
        description: "Please try again later",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Add this function to handle adding suggested questions
  const addSuggestedQuestion = (questionData: Partial<Question>) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: questionData.type as QuestionType,
      title: questionData.title || "New question",
      required: questionData.required || false,
      options: questionData.options,
    };

    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion);
  };
  // const togglePublishStatus = async () => {
  //   if (!surveyId) {
  //     // If survey hasn't been saved yet, save it first
  //     const savedSurvey = await saveSurvey();
  //     if (!savedSurvey) return;
  //   }

  //   setIsPublished(!isPublished);
  //   // This will be saved on the next save operation
  //   toast(isPublished ? "Survey unpublished" : "Survey published", {
  //     description: isPublished
  //       ? "The survey is now in draft mode"
  //       : "The survey is now public and can receive responses",
  //   });
  // };
  // const getSurveyLink = (): string | null => {
  //   if (!surveyId || !isPublished) return null;

  //   const baseUrl = window.location.origin;
  //   return `${baseUrl}/surveys/${surveyId}`;
  // };

  // const handleCopyLink = () => {
  //   const link = getSurveyLink();
  //   if (!link) return;

  //   navigator.clipboard.writeText(link);
  //   toast("Link copied", {
  //     description: "Survey link copied to clipboard",
  //   });
  // };
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="p-8 flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold">Survey Builder</h1>
            <p className="text-muted-foreground">
              Create and manage your surveys
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportSurvey}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importSurvey}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {/* Add AI suggestion button */}
            <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  AI Suggestions
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">AI Question Suggestions</h3>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <QuestionSuggestionChat
                      onAddQuestion={addSuggestedQuestion}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button size="sm" onClick={saveSurvey} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Survey"}
            </Button>
          </div>
        </div>
      </header>
      {/* Tabs */}
      <TabGroup
        defaultValue={"builder"}
        className={"flex flex-col gap-2 flex-1 p-8 py-4"}
      >
        <div className="flex justify-between items-center mb-4">
          <TabList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
            {["Builder", "Preview"].map((tab) => (
              <Tab
                value={tab.toLowerCase()}
                key={tab}
                className={({ selected }) =>
                  ` ${
                    selected ? " bg-background text-foreground" : ""
                  }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
                }
              >
                {tab}
              </Tab>
            ))}
          </TabList>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
              placeholder="Survey Title"
            />

            {/* Publish toggle */}
            {/* <div className="flex items-center space-x-2">
              <Switch
                id="publish-status"
                checked={isPublished}
                onCheckedChange={togglePublishStatus}
              />
              <Label htmlFor="publish-status">
                {isPublished ? "Published" : "Draft"}
              </Label>
            </div> */}

            {/* Share link button */}
            {/* {surveyId && isPublished && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-1"
              >
                <Link2 className="h-4 w-4" />
                Copy Link
              </Button>
            )} */}
          </div>
        </div>

        <TabPanels>
          <TabPanel className={"flex-1 space-y-4"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Questions</h2>
                  <QuestionTypeSelector onSelect={addQuestion} />
                </div>
                {/* Question  */}
                <div className="border rounded-md p-4 min-h-[400px] bg-muted/20">
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="text-muted-foreground mb-4">
                        No questions added yet
                      </div>
                      <Button onClick={() => addQuestion("text")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first question
                      </Button>
                    </div>
                  ) : (
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {questions.map((question) => (
                            <QuestionItem
                              key={question.id}
                              question={question}
                              isSelected={selectedQuestion?.id === question.id}
                              onClick={() => setSelectedQuestion(question)}
                              onRemove={() => removeQuestion(question.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
              {/* Question Editor */}
              <div>
                {selectedQuestion ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">
                        Question Settings
                      </h2>
                      <QuestionEditor
                        question={selectedQuestion}
                        onChange={updateQuestion}
                      />
                    </div>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-medium mb-4">
                        Conditional Logic
                      </h2>
                      <ConditionalLogicEditor
                        question={selectedQuestion}
                        questions={questions.filter(
                          (q) => q.id !== selectedQuestion.id
                        )}
                        onChange={updateQuestion}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Select a question to edit its properties
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>
          <TabPanel className={"flex-1"}>
            {" "}
            <div className="border rounded-md p-6 max-w-3xl mx-auto">
              <PreviewMode title={surveyTitle} questions={questions} />
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default SurveyBuilder;
