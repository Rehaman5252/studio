
'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  QuizQuestion,
} from '@/ai/schemas';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { getCricketQuestions } from '../services/getCricketQuestions';

export async function generateQuiz(
  input: z.infer<typeof GenerateQuizInputSchema>
): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
  return generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ format, askedQuestions }) => {
    try {
      const allQuestions = await getCricketQuestions(format);
      
      const filtered = allQuestions.filter(
        (q) => !(askedQuestions || []).includes(q.questionText)
      );
      
      const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);

      if (selected.length < 5) {
        return { errorMessage: 'Not enough unique questions available for this format.' };
      }
      
      if (db) {
        const batch = writeBatch(db);
        const questionsColl = collection(db, 'askedQuestions');
        selected.forEach(q => {
            const docRef = doc(questionsColl);
            batch.set(docRef, {
                questionText: q.questionText,
                format: format,
                createdAt: new Date(),
            });
        });
        await batch.commit();
      }

      return { questions: selected };
    } catch (error) {
      console.error('❌ generateQuiz flow error:', error);
      return { errorMessage: 'Failed to generate quiz due to a server error.' };
    }
  }
);
