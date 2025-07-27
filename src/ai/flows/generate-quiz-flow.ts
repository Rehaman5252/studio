
'use server';

import { ai } from '@/ai/genkit';
import { getCricketQuestions } from '../services/getCricketQuestions';
import { GenerateQuizInputSchema, GenerateQuizOutputSchema, QuizQuestion } from '../schemas';
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
      
      const validQuestions = allQuestions.filter(q => format === 'Mixed' || q.format === format);
      
      const questionPool = validQuestions.length < 5 ? allQuestions : validQuestions;

      const shuffledQuestions = questionPool.sort(() => 0.5 - Math.random());
      const selectedQuestionsRaw = shuffledQuestions.slice(0, 5);

      // **FIX:** Explicitly parse each question with the Zod schema.
      // This ensures the data structure is correct before the flow returns,
      // preventing a silent crash in Genkit's output validation step.
      const selectedQuestions = selectedQuestionsRaw.map(q => QuizQuestion.parse(q));

      return { questions: selectedQuestions };
      
    } catch (err) {
      console.error("Quiz generation failed in flow:", err);
      // As a last resort, return a generic set of questions if everything else fails
      const fallbackQuestions = (await getCricketQuestions())
        .slice(0, 5)
        .sort(() => 0.5 - Math.random())
        .map(q => QuizQuestion.parse(q)); // Also parse fallbacks
      return { questions: fallbackQuestions };
    }
  }
);
