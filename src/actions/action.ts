"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { data: authData, error } = await supabase.auth.signInWithPassword(
    data
  );

  if (error) {
    // redirect("/error");
    return { error: error.message };
  } else if (authData.user) {
    const { error: userError } = await supabase
      .from("users")
      .update({ last_login: new Date() })
      .eq("id", authData.user.id);
    if (userError) {
      console.error("Error updating last login:", userError);
      return { error: userError.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        avatar_url: "",
      },
      // emailRedirectTo: `${env.SITE_URL}/verify/callback`,
    },
  });
  console.log("error", error, authData);

  if (error) {
    // redirect("/error");
    if (error) {
      if (error.message.toLowerCase().includes("email")) {
        return { error: { field: "email", message: error.message } };
      } else if (error.message.toLowerCase().includes("password")) {
        return { error: { field: "password", message: error.message } };
      } else {
        return { error: { field: "form", message: error.message } };
      }
    }
  } else if (authData.user) {
    const { error: userError } = await supabase.from("users").upsert(
      {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        avatar_url: "",
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );
    if (userError) {
      console.error("Error creating user record:", userError);
      return {
        error: { field: "form", message: "Failed to create user record" },
      };
    }
  }
  revalidatePath("/", "layout");
  redirect("/verify");
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect("/error");
    // return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
