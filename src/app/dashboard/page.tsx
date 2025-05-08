import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";
import { getServerSession } from "@/lib/auth/getServerSession";
import Link from "next/link";
import SurveyList from "@/components/survey-list";

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Surveys</h1>
          <p className="text-muted-foreground">Manage your surveys</p>
        </div>
        <Button>
          <Link href="/builder" className="flex  items-center">
            <Plus className="mr-2 h-4 w-4" />
            Create New Survey
          </Link>
        </Button>
      </div>
      {/* Surveys */}
      <SurveyList />
    </div>
  );
}
