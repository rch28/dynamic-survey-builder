"use client";
import { DotsLoader } from "@/components/dots-loader";
import Label from "@/components/form-inputs/label";
import { UserSurveys } from "@/components/profile/user-surveys";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import "./profile.css";
import { CollaboratorList } from "@/components/collaboration/collaborator-list";
import { ActivityHistory } from "@/components/profile/activity-history";
import { createClient } from "@/utils/supabase/client";

const ProfilePage = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      fetchUserProfile();
    }
  }, [user, isLoading, router]);
  const fetchUserProfile = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setName(user.user_metadata.name || "");
        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata.avatar_url || "");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUpdating(true);
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, avatarUrl: avatarUrl }),
      });

      if (response.ok) {
        toast.success("Profile updated", {
          description: "Your profile has been updated successfully",
        });
      } else {
        toast.error("Update failed", {
          description: "Failed to update your profile",
        });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Update failed", {
        description: "Failed to update your profile",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        toast.success("Avatar updated", {
          description: "Your profile picture has been updated",
        });
      } else {
        toast.error("Upload failed", {
          description: "Failed to upload your profile picture",
        });
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error("Upload failed", {
        description: "Failed to upload your profile picture",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <DotsLoader />
      </div>
    );
  }
  return (
    <div className="p-8">
      <div className="profile-grid gap-8">
        <div className="">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatarUrl || "/placeholder.svg"}
                    alt={name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl p-4">
                    {name && name.trim()
                      ? name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="relative">
                  <Button variant="outline" size="sm" className="relative">
                    Change Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="">
          <TabGroup
            defaultValue={"surveys"}
            className={"flex flex-col gap-2 flex-1 p-8 py-4"}
          >
            <div className="flex justify-between items-center mb-4">
              <TabList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
                <Tab
                  value={"surveys"}
                  className={({ selected }) =>
                    ` ${
                      selected ? " bg-background text-foreground" : ""
                    }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
                  }
                >
                  My Surveys
                </Tab>
                <Tab
                  value={"collaborations"}
                  className={({ selected }) =>
                    ` ${
                      selected ? " bg-background text-foreground" : ""
                    }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
                  }
                >
                  Collaborations
                </Tab>
                <Tab
                  value={"activity"}
                  className={({ selected }) =>
                    ` ${
                      selected ? " bg-background text-foreground" : ""
                    }  px-3 py-0.5 rounded-md text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary/20`
                  }
                >
                  Activity
                </Tab>
              </TabList>
            </div>

            <TabPanels>
              <TabPanel className={"mt-4 flex-1"}>
                <UserSurveys />
              </TabPanel>
              <TabPanel className={"mt-4 flex-1"}>
                <CollaboratorList />
              </TabPanel>
              <TabPanel className={"mt-4 flex-1"}>
                <ActivityHistory />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
