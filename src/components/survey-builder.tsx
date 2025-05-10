"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Download,
  MessageSquare,
  Plus,
  Save,
  Upload,
  Settings,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { QuestionEditor } from "./question-editor";
import { ConditionalLogicEditor } from "./conditonal-login-editor";
import PreviewMode from "./preview-mode";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { QuestionType, Survey } from "@/types/survey";
import { useSurveyForm } from "@/hooks/use-survey-form";
import { Form } from "./ui/form";
import { Input } from "./ui/input";
import { QuestionItem } from "./question-item";
import { QuestionTypeSelector } from "./question-type-selector";
import { QuestionSuggestionChat } from "./question-suggestion-chat";
import { createInitialSurvey, useSurveyStore } from "@/store/survey-store";
import { SurveyMetadata } from "./survey-metadata";
import { SurveyDrafts } from "./survey-drafts";
import { CollaboratorList } from "./collaboration/collaborator-list";

interface SurveyBuilderProps {
  initialSurvey?: Survey | null;
}

const SurveyBuilder = ({ initialSurvey = null }: SurveyBuilderProps) => {
  const survey = useSurveyStore((state) => state.survey);
  const setSurvey = useSurveyStore((state) => state.setSurvey);
  const selectedQuestionId = useSurveyStore(
    (state) => state.selectedQuestionId
  );
  const selectQuestion = useSurveyStore((state) => state.selectQuestion);
  const addQuestion = useSurveyStore((state) => state.addQuestion);
  const removeQuestion = useSurveyStore((state) => state.removeQuestion);
  const reorderQuestions = useSurveyStore((state) => state.reorderQuestions);
  const updateSurveyTitle = useSurveyStore((state) => state.updateSurveyTitle);
  const markAsSaved = useSurveyStore((state) => state.markAsSaved);
  // Use React Hook Form
  const { form } = useSurveyForm();

  const [surveyId, setSurveyId] = useState<string | null>(
    initialSurvey?.id || null
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (initialSurvey) {
      setSurvey({
        id: initialSurvey.id,
        title: initialSurvey.title || "Untitled Survey",
        description: initialSurvey.description || "",
        questions: initialSurvey.questions || [],
        metadata: {
          ...createInitialSurvey().metadata,
          ...initialSurvey.metadata,
        },
        isDraft: false,
        created_at: initialSurvey.created_at || new Date().toISOString(),
        updated_at: initialSurvey.updated_at || new Date().toISOString(),
      });
      setSurveyId(initialSurvey.id || null);
    }
  }, [initialSurvey, setSurvey]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = survey.questions.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = survey.questions.findIndex(
        (item) => item.id === over.id
      );

      reorderQuestions(oldIndex, newIndex);
    }
  };
  const handleQuestionTypeSelect = (type: QuestionType) => {
    addQuestion(type);
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
          setSurvey({
            title: surveyData.title,
            description: surveyData.description || "",
            questions: surveyData.questions,
            metadata: surveyData.metadata || {},
            isDraft: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Error parsing JSON file", e);
        toast.error("Import Failed", {
          description: "Failed to import survey. The file format is invalid.",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset the input value
  };
  // export survey data to a JSON file
  const exportSurvey = () => {
    // get survey data
    const surveyData = {
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      metadata: survey.metadata,
    };
    const dataStr = JSON.stringify(surveyData, null, 2);

    const blob = new Blob([dataStr], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const defaultFileName = `${survey.title.replace(/\s+/g, "_")}.json`;
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
        title: survey.title,
        questions: survey.questions,
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
        // Mark the survey as saved
        markAsSaved();

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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="p-8 space-y-6 py-4 ">
          <div className="flex items-center justify-between">
            <div className="">
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
              {/* AI suggestion button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Suggestions
              </Button>
              <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
                <SheetContent
                  side="right"
                  className="w-[400px] sm:w-[540px] p-0"
                >
                  <div className="flex flex-col h-full">
                    <SheetTitle className="flex items-center justify-between p-4 border-b">
                      <span className="font-semibold">
                        AI Question Suggestions
                      </span>
                    </SheetTitle>
                    <div className="flex-1 overflow-hidden">
                      <QuestionSuggestionChat />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <div className="flex justify-between w-full ">
            <div></div>
            <div className="flex items-center flex-wrap gap-2 ">
              {/* Survey Drafts */}
              <SurveyDrafts />

              {/* Collaboration button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollaborationOpen(true)}
                disabled={!surveyId}
              >
                <Users className="mr-2 h-4 w-4" />
                Collaborate
              </Button>
              <Sheet
                open={isCollaborationOpen}
                onOpenChange={setIsCollaborationOpen}
              >
                <SheetContent
                  side="right"
                  className="w-[400px] sm:w-[540px] overflow-y-auto"
                >
                  <div className="flex flex-col h-full">
                    <SheetTitle className="flex items-center justify-between p-4 border-b">
                      <span className="font-semibold">Collaboration</span>
                    </SheetTitle>
                    <div className="flex-1 overflow-y-auto p-4">
                      <CollaboratorList />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              {/* Settings button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              {/* Settings sheet */}
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent
                  side="right"
                  className="w-[400px] sm:w-[540px] overflow-y-auto"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold">Survey Settings</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <SurveyMetadata />
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

          <Form {...form}>
            <form className="space-y-4">
              <Input
                value={survey.title}
                onChange={(e) => updateSurveyTitle(e.target.value)}
                className="text-xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
              />
            </form>
          </Form>
        </div>

        <TabPanels>
          <TabPanel className={"flex-1 space-y-4"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Questions</h2>
                  <QuestionTypeSelector onSelect={handleQuestionTypeSelect} />
                </div>
                {/* Question  */}
                <div className="border rounded-md p-4 min-h-[400px] bg-muted/20">
                  {survey?.questions?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="text-muted-foreground mb-4">
                        No questions added yet
                      </div>
                      <Button onClick={() => addQuestion(QuestionType.TEXT)}>
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
                        items={survey?.questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {survey.questions.map((question) => (
                            <QuestionItem
                              key={question.id}
                              question={question}
                              isSelected={selectedQuestionId === question.id}
                              onClick={() => selectQuestion(question.id)}
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
                {selectedQuestionId ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">
                        Question Settings
                      </h2>
                      <QuestionEditor questionId={selectedQuestionId} />
                    </div>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-medium mb-4">
                        Conditional Logic
                      </h2>
                      <ConditionalLogicEditor
                        questionId={selectedQuestionId}
                        questions={survey.questions.filter(
                          (q) => q.id !== selectedQuestionId
                        )}
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
              <PreviewMode title={survey.title} questions={survey.questions} />
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default SurveyBuilder;
