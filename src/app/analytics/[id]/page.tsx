"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, subDays } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SurveyAnalytics {
  survey: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  };
  totalResponses: number;
  completionRate: number;
  averageTimeToComplete: number;
  responsesByDay: {
    date: string;
    count: number;
  }[];
  responsesByQuestion: {
    questionId: string;
    questionTitle: string;
    responseCount: number;
  }[];
  responsesByDevice: {
    device: string;
    count: number;
  }[];
}

export default function SurveyAnalyticsPage() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchAnalytics();
    }
  }, [user, isLoading, router, id, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      const queryParams = new URLSearchParams();

      if (dateRange?.from) {
        queryParams.append("from", format(dateRange.from, "yyyy-MM-dd"));
      }

      if (dateRange?.to) {
        queryParams.append("to", format(dateRange.to, "yyyy-MM-dd"));
      }

      const response = await fetch(
        `/api/surveys/${id}/analytics?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else if (response.status === 404) {
        toast("Survey not found", {
          description:
            "The survey you're looking for doesn't exist or you don't have access to it",
        });
        router.push("/dashboard");
      } else {
        toast.error("Error", {
          description: "Failed to fetch analytics data",
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Error", {
        description: "Failed to fetch analytics data",
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  if (isLoading || isLoadingAnalytics) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading Analytics...</h1>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">No Analytics Data</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              There is no analytics data available for this survey yet. Share
              your survey to collect responses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{analytics.survey.title}</h1>
          <p className="text-muted-foreground">
            {analytics.survey.description}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">Survey Analytics</h2>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalResponses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(analytics.completionRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.averageTimeToComplete} sec
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Responses Over Time</CardTitle>
              <CardDescription>
                Number of responses received per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.responsesByDay}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Responses by Question</CardTitle>
              <CardDescription>
                Number of responses for each question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.responsesByQuestion}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="questionTitle"
                      width={150}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="responseCount"
                      name="Responses"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Responses by Device</CardTitle>
              <CardDescription>
                Distribution of responses by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.responsesByDevice}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="device"
                    >
                      {analytics.responsesByDevice.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
