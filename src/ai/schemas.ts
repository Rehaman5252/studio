
import { z } from "zod";

export const QuizQuestion = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string()
});

export const QuizSchema = z.object({
  questions: z.array(QuizQuestion).length(5)
});

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestionType = z.infer<typeof QuizQuestion>;
    