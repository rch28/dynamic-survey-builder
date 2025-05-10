"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Trash2, FileText, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useSurveyStore } from "@/store/survey-store";

import type { Survey } from "@/types/survey";
import { toast } from "sonner";

export function SurveyDrafts() {
  const saveDraft = useSurveyStore((state) => state.saveDraft);
  const loadDraft = useSurveyStore((state) => state.loadDraft);
  const deleteDraft = useSurveyStore((state) => state.deleteDraft);
  const getDrafts = useSurveyStore((state) => state.getDrafts);
  const currentSurvey = useSurveyStore((state) => state.survey);

  const [drafts, setDrafts] = useState<Survey[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const allDrafts = getDrafts();
      setDrafts(allDrafts.filter((draft: Survey) => !!draft.id));
    }
  }, [isOpen, getDrafts]);

  const handleSaveDraft = () => {
    saveDraft();
    toast.success("Draft saved", {
      description: "Your survey draft has been saved locally",
    });
  };

  const handleLoadDraft = (id: string) => {
    loadDraft(id);
    setIsOpen(false);
    toast.success("Draft loaded", {
      description: "Your survey draft has been loaded",
    });
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(getDrafts());
    toast.success("Draft deleted", {
      description: "Your survey draft has been deleted",
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSaveDraft}>
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              My Drafts
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Saved Drafts</DialogTitle>
              <DialogDescription>
                Your locally saved survey drafts. These are stored in your
                browser and not on the server.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {drafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No drafts found. Save a draft to see it here.
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {drafts.map((draft) => {
                      const draftId = draft.id || "unknown";
                      return (
                        <Card
                          key={draft.id}
                          className={cn(
                            "cursor-pointer hover:border-primary/50 transition-colors",
                            selectedDraft === draft.id && "border-primary"
                          )}
                          onClick={() => setSelectedDraft(draftId)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                              {draft.title}
                            </CardTitle>
                            <CardDescription>
                              {draft.questions.length} questions
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              Last saved:{" "}
                              {draft.lastSavedAt
                                ? format(new Date(draft.lastSavedAt), "PPp")
                                : "Unknown"}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="mr-1 h-3 w-3" />
                              Created:{" "}
                              {draft.created_at
                                ? format(new Date(draft.created_at), "PP")
                                : "Unknown"}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2">
                            <div className="flex justify-between w-full">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDraft(draft.id!);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadDraft(draft.id!);
                                }}
                              >
                                Load
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
