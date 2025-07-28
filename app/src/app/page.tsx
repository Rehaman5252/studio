
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link href="/home" className="text-blue-500 underline text-lg">
        Go to Home
      </Link>
    </main>
  );
}
