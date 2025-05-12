"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        checkAdminStatus();
      }
    }
  }, [user, isLoading, router]);

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

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <SurveyAnalytics />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AdminLogs />
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <VisitorStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
