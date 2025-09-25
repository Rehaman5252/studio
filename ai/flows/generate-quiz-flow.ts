

import { z } from "zod";
import { defineFlow } from "@genkit-ai/flow";
import { generateQuiz } from "../actions/generateQuiz";

export const generateQuizFlow = defineFlow(
  {
    name: "generateQuizFlow",
    inputSchema: z.object({
      topic: z.string(),
      numQuestions: z.number(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    return await generateQuiz(input.topic, input.numQuestions);
  }
);
    
