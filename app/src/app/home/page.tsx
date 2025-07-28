
"use client";

import React from "react";
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-green-600">
        Welcome to IndCric Home
      </h1>
      <Link href="/quiz" className="text-blue-500 underline text-lg">
          Start a Quiz
      </Link>
    </main>
  );
}
