"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLog } from "@/types/survey";
import { toast } from "sonner";

export function ActivityHistory() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      toast.error("Error", {
        description: "Failed to fetch your activity history",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    switch (activity.action) {
      case "create_survey":
        return "Created a new survey";
      case "update_survey":
        return "Updated a survey";
      case "delete_survey":
        return "Deleted a survey";
      case "add_collaborator":
        return `Added ${
          activity.details?.collaborator_email || "a user"
        } as a collaborator`;
      case "update_collaborator":
        return `Changed a collaborator's role to ${
          activity.details?.role || "a new role"
        }`;
      case "remove_collaborator":
        return "Removed a collaborator";
      case "view_survey":
        return "Viewed a survey";
      case "submit_response":
        return "Submitted a response to a survey";
      default:
        return activity.action.replace(/_/g, " ");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">Loading your activity history...</div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Activity</h3>

      {activities.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <Card className="p-4">
          <ul className="space-y-4 divide-y">
            {activities.map((activity) => (
              <li key={activity.id} className="pt-4 first:pt-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.resourceType}{" "}
                      {activity.resourceId
                        ? `#${activity.resourceId.substring(0, 8)}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt!), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
