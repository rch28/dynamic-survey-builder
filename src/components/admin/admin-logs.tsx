"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Search } from "lucide-react";
import type { ActivityLog } from "@/types/survey";
import { toast } from "sonner";

export function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/logs?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } else {
        toast.error("Error", {
          description: "Failed to fetch activity logs",
        });
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Error", {
        description: "Failed to fetch activity logs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const actionOptions = [
    { value: "all", label: "All Actions" },
    { value: "create_survey", label: "Create Survey" },
    { value: "update_survey", label: "Update Survey" },
    { value: "delete_survey", label: "Delete Survey" },
    { value: "add_collaborator", label: "Add Collaborator" },
    { value: "update_collaborator", label: "Update Collaborator" },
    { value: "remove_collaborator", label: "Remove Collaborator" },
    { value: "view_survey", label: "View Survey" },
    { value: "submit_response", label: "Submit Response" },
    { value: "update_profile", label: "Update Profile" },
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>
          View all user activity across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search by user, action, or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          <div className="w-full md:w-64">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Anonymous
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <div>
                          <div>{log.resourceType}</div>
                          {log.resourceId && (
                            <div className="text-sm text-muted-foreground">
                              ID: {log.resourceId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        {log.createdAt
                          ? format(new Date(log.createdAt), "PPp")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
