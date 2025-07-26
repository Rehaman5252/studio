
'use server';

import { ai } from '@/ai/genkit';
import { getCricketQuestions } from '../services/getCricketQuestions';
import { QuizQuestion, GenerateQuizInputSchema, GenerateQuizOutputSchema } from '../schemas';
import { z } from 'zod';
import { generate } from 'genkit/next';

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
      const unaskedQuestions = validQuestions.filter(q => !askedQuestions.includes(q.id));

      if (unaskedQuestions.length < 5) {
        // If we run out of unasked questions, reset the asked list but keep the ones from the current session.
        const resetUnasked = validQuestions.filter(q => !askedQuestions.slice(-10).includes(q.id));
        if (resetUnasked.length >= 5) {
             return { questions: resetUnasked.sort(() => 0.5 - Math.random()).slice(0, 5) };
        } else {
             // Fallback to all valid questions for the format if there's still not enough
             return { questions: validQuestions.sort(() => 0.5 - Math.random()).slice(0, 5) };
        }
      }

      return { questions: unaskedQuestions.sort(() => 0.5 - Math.random()).slice(0, 5) };
    } catch (err) {
      console.error("Quiz generation failed in flow:", err);
      // As a last resort, return a generic set of questions if everything else fails
      const fallbackQuestions = await getCricketQuestions();
      return { questions: fallbackQuestions.slice(0, 5) };
    }
  }
);
