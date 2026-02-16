import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border-black/10 bg-white shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight text-black">
            Sign in
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Enter your email and password to access the dashboard.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {decodeURIComponent(error)}
            </p>
          )}
          <form action={signIn} className="space-y-4">
            <input
              type="hidden"
              name="redirectTo"
              value={redirectTo || "/dashboard"}
            />
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-900"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-900"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-zinc-800"
            >
              Sign in
            </Button>
          </form>
          <p className="text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link
              href={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="font-medium text-black underline underline-offset-2 hover:no-underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
