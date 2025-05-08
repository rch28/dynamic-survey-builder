"use client";

import type React from "react";

import Link from "next/link";
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
import {
  registerDefaultValues,
  RegisterSchema,
  registerSchema,
} from "@/lib/schemas/register-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertError from "../ui/ErrorMessage";
import Label from "../form-inputs/label";
import TextField from "../form-inputs/text-field";
import { signup } from "@/actions/action";

export function RegisterForm() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm({
    mode: "all",
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
  });

  const onSubmit: SubmitHandler<RegisterSchema> = async (data) => {
    // const success = await register(data.name, data.email, data.password);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);
    const res = await signup(formData);
    if (res.error) {
      setError("email", {
        type: "manual",
        message: res.error.message,
      });
      return;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <AlertError error={errors?.root?.message} />
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Name
            </Label>
            <TextField<RegisterSchema>
              control={control}
              name="name"
              type="text"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <TextField<RegisterSchema>
              control={control}
              name="email"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <TextField<RegisterSchema>
              control={control}
              name="password"
              type="password"
              placeholder="******"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" required>
              Confirm Password
            </Label>
            <TextField<RegisterSchema>
              control={control}
              name="confirmPassword"
              type="password"
              placeholder="******"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
