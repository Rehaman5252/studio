
'use server';

import { ai } from '@/ai/genkit';
import { getCricketQuestions } from '../services/getCricketQuestions';
import { GenerateQuizInputSchema, GenerateQuizOutputSchema } from '../schemas';
import { z } from 'zod';

export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
    return await generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ format }) => {
    try {
      const allQuestions = await getCricketQuestions();
      
      // Filter questions based on the selected format. If format is 'Mixed', all questions are valid.
      const validQuestions = allQuestions.filter(q => format === 'Mixed' || q.format === format);
      
      // A robust app would have a much larger question bank.
      // If we don't have enough questions for the chosen format, fall back to the full list.
      const questionPool = validQuestions.length < 5 ? allQuestions : validQuestions;

      // Shuffle the array and pick the first 5 questions.
      const shuffledQuestions = questionPool.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffledQuestions.slice(0, 5);

      return { questions: selectedQuestions };
      
    } catch (err) {
      console.error("Quiz generation failed in flow:", err);
      // As a last resort, return a generic set of questions if everything else fails
      const fallbackQuestions = await getCricketQuestions();
      return { questions: fallbackQuestions.slice(0, 5).sort(() => 0.5 - Math.random()) };
    }
  }
);
