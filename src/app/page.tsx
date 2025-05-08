import SurveyBuilder from "@/components/survey-builder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey Builder Admin Panel",
  description:
    "Create and manage surveys with an intuitive drag-and-drop interface",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SurveyBuilder />
    </div>
  );
}
