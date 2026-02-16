import Link from "next/link";

export default function InterviewNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold text-black">Link not found</h1>
        <p className="text-zinc-600">
          This interview link is invalid or has expired.
        </p>
      </div>
    </div>
  );
}
