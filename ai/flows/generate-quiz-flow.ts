
import { z } from "zod";
import { defineFlow, ai } from "@/ai/genkit"; // Use pre-configured ai object

export const generateQuizFlow = defineFlow({
  input: z.object({
    topic: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    numberOfQuestions: z.number().min(1).max(50),
  }),
  async execute({ input, tools }) {
    const { topic, difficulty, numberOfQuestions } = input;

    // Generate quiz directly using prompt-based logic
    const response = await tools.ai.chat({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a cricket quiz generator. Provide high-quality MCQs.",
        },
        {
          role: "user",
          content: `Generate ${numberOfQuestions} multiple choice questions on "${topic}" with difficulty "${difficulty}". Include 4 options per question and indicate the correct answer.`,
        },
      ],
    });

    return {
      quiz: response.output_text,
    };
  },
});
