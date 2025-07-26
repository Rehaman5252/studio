
import { defineFlow } from "@genkit-ai/core";
import { getCricketQuestions } from "../services/getCricketQuestions";
import { QuizQuestion } from "../schemas";
import { z } from "zod";

export const generateQuizFlow = defineFlow(
  {
    name: "generate-quiz-flow",
    inputSchema: z.any(),
    outputSchema: z.object({
      questions: z.array(QuizQuestion)
    })
  },
  async () => {
    const questions = await getCricketQuestions();
    if (!questions || questions.length < 5) {
      throw new Error("Failed to fetch valid quiz questions.");
    }
    return { questions: questions.slice(0, 5) };
  }
);
    