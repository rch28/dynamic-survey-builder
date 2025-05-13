"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLogs } from "@/components/admin/admin-logs";
import { UserManagement } from "@/components/admin/user-management";
import { SurveyAnalytics } from "@/components/admin/survey-analytics";
import { VisitorStats } from "@/components/admin/visitor-stats";
import { toast } from "sonner";
import { DotsLoader } from "@/components/dots-loader";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/check");

        if (response.ok) {
          setIsAdmin(true);
        } else {
          toast.error("Access Denied", {
            description: "You don't have permission to access the admin area",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        router.push("/dashboard");
      }
    };
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        checkAdminStatus();
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <DotsLoader />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, view logs, and analyze visitor statistics
          </CardDescription>
        </CardHeader>
      </Card>

      <TabGroup
        defaultValue={"analytics"}
        className={"flex flex-col gap-2 flex-1 p-8 py-4"}
      >
        <div className="flex justify-between items-center mb-4">
          <TabList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
            <Tab
              value="analytics"
              className={({ selected }) =>
                ` ${
                  selected ? " bg-background text-foreground" : ""
                }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
              }
            >
              Analytics
            </Tab>
            <Tab
              value="users"
              className={({ selected }) =>
                ` ${
                  selected ? " bg-background text-foreground" : ""
                }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
              }
            >
              Users
            </Tab>
            <Tab
              value="logs"
              className={({ selected }) =>
                ` ${
                  selected ? " bg-background text-foreground" : ""
                }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
              }
            >
              Activity Logs
            </Tab>
            <Tab
              value="visitors"
              className={({ selected }) =>
                ` ${
                  selected ? " bg-background text-foreground" : ""
                }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
              }
            >
              Visitors
            </Tab>
          </TabList>
        </div>

        <TabPanels>
          <TabPanel className={"flex-1 "}>
            <SurveyAnalytics />
          </TabPanel>
          <TabPanel className={"flex-1"}>
            {" "}
            <UserManagement />
          </TabPanel>
          <TabPanel className={"flex-1"}>
            {" "}
            <AdminLogs />
          </TabPanel>
          <TabPanel className={"flex-1"}>
            {" "}
            <VisitorStats />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
