"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import SurveyBuilder from "@/components/survey-builder";
import { toast } from "sonner";
import LineLoader from "@/components/line-loadet";
import { DotsLoader } from "@/components/dots-loader";

const EditSurveyPage = () => {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Fetch the survey
    const fetchSurvey = async () => {
      if (!user) return;

      try {
        setIsLoadingSurvey(true);
        const response = await fetch(`/api/surveys/${id}`);

        if (response.ok) {
          const data = await response.json();
          setSurvey(data.survey);
        } else if (response.status === 404) {
          toast.success("Survey not found", {
            description:
              "The survey you're looking for doesn't exist or you don't have access to it",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch survey:", error);
        toast.error("Error loading survey", {
          description: "Please try again later",
        });
      } finally {
        setIsLoadingSurvey(false);
      }
    };

    if (id) {
      fetchSurvey();
    }
  }, [id, user, router]);

  if (isLoading || isLoadingSurvey) {
    return (
      <>
        <LineLoader />
        <div className="flex min-h-screen items-center justify-center">
          <DotsLoader />
        </div>
      </>
    );
  }

  return <SurveyBuilder initialSurvey={survey} />;
};
export default EditSurveyPage;
