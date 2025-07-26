
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
  async ({ format, askedQuestions }) => {
    try {
      const allQuestions = await getCricketQuestions();
      
      const validQuestions = allQuestions.filter(q => q.format === format || format === 'Mixed');
      
      // For now, we are not filtering by askedQuestions as the mock list is small.
      // This ensures we always have enough questions.
      // const unaskedQuestions = validQuestions.filter(q => !askedQuestions.includes(q.id));
      
      // A robust app would have a much larger question bank.
      if (validQuestions.length < 5) {
         // Fallback to all questions if a specific format has less than 5
         const allFallback = await getCricketQuestions();
         return { questions: allFallback.sort(() => 0.5 - Math.random()).slice(0, 5) };
      }

      return { questions: validQuestions.sort(() => 0.5 - Math.random()).slice(0, 5) };
    } catch (err) {
      console.error("Quiz generation failed in flow:", err);
      // As a last resort, return a generic set of questions if everything else fails
      const fallbackQuestions = await getCricketQuestions();
      return { questions: fallbackQuestions.slice(0, 5) };
    }
  }
);
    