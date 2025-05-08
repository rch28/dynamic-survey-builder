"use client";

import type React from "react";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginDefaultValues,
  LoginSchema,
  loginSchema,
} from "@/lib/schemas/login-schema";
import TextField from "../form-inputs/text-field";
import Label from "../form-inputs/label";
import AlertError from "../ui/ErrorMessage";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<LoginSchema>({
    mode: "all",
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
  });
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    clearErrors("root");

    const response = await login(data.email, data.password);
    if (!response) {
      setTimeout(() => {
        setError("root", {
          type: "manual",
          message: "Invalid email or password",
        });
      }, 1500);
      return;
    }
    router.push("/");
  };
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <AlertError error={errors.root?.message} />
          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <TextField<LoginSchema>
              name="email"
              control={control}
              type="email"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <TextField<LoginSchema>
              control={control}
              name="password"
              type="password"
              placeholder="******"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
