"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo =
    (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    redirect("/signup?error=Email+and+password+required");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password+must+be+at+least+6+characters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  redirect(redirectTo);
}
