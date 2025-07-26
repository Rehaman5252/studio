
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { QuizSchema } from "@/ai/schemas";
import type { Quiz } from "@/ai/schemas";

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const result = await generateQuizFlow.run({});
        const parsed = QuizSchema.safeParse(result);
        if (!parsed.success) {
          console.error("Invalid quiz structure:", parsed.error);
          throw new Error("Invalid quiz structure");
        }
        setQuiz(parsed.data);
      } catch (err) {
        console.error("Quiz loading failed:", err);
        toast.error("A critical error occurred while fetching the quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, []);

  if (loading) return <div className="p-4">Loading quiz...</div>;

  if (!quiz) return <div className="p-4 text-red-600">Could not load quiz.</div>;

  return (
    <div className="p-4 space-y-4">
      {quiz.questions.map((q, idx) => (
        <div key={idx} className="border p-4 rounded-xl shadow">
          <p className="font-semibold">{idx + 1}. {q.question}</p>
          <ul className="mt-2 space-y-2">
            {q.options.map((opt, i) => (
              <li key={i} className="p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer">{opt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
    