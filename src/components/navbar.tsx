"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon } from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useSurveyStore } from "@/store/survey-store";

export function Navbar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const resetState = useSurveyStore((state) => state.resetState);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }
  const handleLogout = () => {
    logout();
    resetState();
  };
  return (
    <header className="border-b">
      <div className="p-8 flex h-16 items-center justify-between w-full">
        <Link href="/" className="text-xl font-bold">
          Survey Builder
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={pathname === "/" ? "text-primary" : "text-foreground"}
          >
            Home
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className={
                pathname === "/dashboard" ? "text-primary" : "text-foreground"
              }
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/about"
            className={
              pathname === "/about" ? "text-primary" : "text-foreground"
            }
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Add the ThemeSelector component here */}
          <ThemeSelector />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <div className="px-2 py-1.5 text-sm font-medium">
                  {user.name}
                </div> */}
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
