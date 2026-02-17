import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <main className="w-full max-w-sm space-y-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Cluvo
        </h1>
        <p className="text-zinc-600">
          Voice-led customer interviews. Sign in to access your dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-black text-white hover:bg-zinc-800">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-zinc-300">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
