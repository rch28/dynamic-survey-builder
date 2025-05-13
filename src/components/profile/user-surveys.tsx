import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

import SurveyList from "../survey-list";

export function UserSurveys() {
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
    </div>
  );
}
