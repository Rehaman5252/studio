'use server';
/**
 * @fileOverview A flow that generates a 5-question cricket quiz.
 *
 * - generateQuiz - A function that generates quiz questions based on a format.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateQuizInput,
    GenerateQuizOutput,
    GenerateQuizInputSchema,
    GenerateQuizOutputSchema
} from '@/ai/schemas';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are a master cricket quiz creator. Your task is to generate a highly challenging 5-question quiz about the "{{format}}" cricket format.

  RULES:
  1.  **Difficulty**: The questions must be VERY difficult, targeting expert-level knowledge. Avoid common trivia.
  2.  **Uniqueness**: The 5 questions you generate must be unique from each other and should be obscure.
  3.  **Plausible Options**: All four options for each question must be extremely close and believable to challenge the user.
  4.  **Correctness**: The \`correctAnswer\` must be an exact match to one of the provided options.
  5.  **Format Focus**: All questions must be strictly related to the "{{format}}" format.
  6.  **Hints**: For each question, provide a concise, clever hint that guides the user toward the answer without giving it away.

  Generate the 5 questions now.
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
