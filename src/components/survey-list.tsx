"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import LineLoader from "./line-loadet";
import { DotsLoader } from "./dots-loader";

import type { Survey } from "@/types";
const SurveyList = () => {
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch("/api/surveys");
        if (!response.ok) {
          throw new Error("Failed to fetch surveys");
        }
        const data = await response.json();
        setSurveys(data?.surveys);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching surveys:", error);
      }
    };
    fetchSurveys();
  }, []);

  const handleCreateSurvey = async (id?: string) => {
    if (id) {
      router.push(`/builder/${id}`);
      return;
    } else {
      router.push("/builder");
    }
  };
  const handleDeleteSurvey = async (id: string) => {
    const response = await fetch(`/api/surveys/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setSurveys((prevSurveys) =>
        prevSurveys.filter((survey) => survey.id !== id)
      );
    } else {
      console.error("Error deleting survey");
    }
  };

  if (loading) {
    return (
      <>
        <LineLoader />
        <div className="flex items-center justify-center h-96">
          <DotsLoader />
        </div>
      </>
    );
  }

  return (
    <>
      {" "}
      {surveys.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No surveys yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first survey to get started
          </p>
          <Button onClick={() => handleCreateSurvey()}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Survey
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey: Survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle className="truncate">{survey.title}</CardTitle>
                <CardDescription>
                  {survey.questions.length} questions • Updated{" "}
                  {formatDistanceToNow(new Date(survey.updated_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(survey.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateSurvey(survey.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSurvey(survey.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default SurveyList;
