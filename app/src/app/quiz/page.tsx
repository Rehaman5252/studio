"use client";

import React, { useEffect, useState } from "react";
import { fetchQuizQuestions } from "@/lib/firestore";

export default function QuizPage() {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchQuizQuestions().then(setQuestions).catch(console.error);
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Quiz</h1>
      {questions.map((q, index) => (
        <div key={q.id} className="mb-6 border-b pb-4">
          <p className="font-semibold">{index + 1}. {q.question}</p>
          <ul className="ml-4 list-disc">
            {q.options?.map((opt: string, idx: number) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
