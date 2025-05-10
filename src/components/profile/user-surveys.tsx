"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Trash2, Plus, BarChart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Survey } from "@/types";
import SurveyList from "../survey-list";

export function UserSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/surveys");
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error("Failed to fetch surveys:", error);
      toast.error("Error", {
        description: "Failed to fetch your surveys",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey?")) return;

    try {
      const response = await fetch(`/api/surveys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSurveys(surveys.filter((survey) => survey.id !== id));
        toast.success("Survey deleted", {
          description: "Your survey has been deleted successfully",
        });
      } else {
        toast.error("Delete failed", {
          description: "Failed to delete the survey",
        });
      }
    } catch (error) {
      console.error("Failed to delete survey:", error);
      toast.error("Delete failed", {
        description: "Failed to delete the survey",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading your surveys...</div>;
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">My Surveys</h3>
        <Button asChild>
          <Link href="/builder">
            <Plus className="h-4 w-4 mr-2" />
            Create New Survey
          </Link>
        </Button>
      </div>
      <SurveyList />
      {/* {surveys.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground mb-4">
            You haven't created any surveys yet
          </p>
          <Button asChild>
            <Link href="/builder">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Survey
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{survey.title}</CardTitle>
                <CardDescription>
                  {survey.questions.length} questions • Updated{" "}
                  {formatDistanceToNow(new Date(survey.updated_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(survey.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/builder/${survey.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/analytics/${survey.id}`}>
                      <BarChart className="h-4 w-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSurvey(survey.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )} */}
    </div>
  );
}
