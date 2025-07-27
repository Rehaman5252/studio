
'use server';

import { ai } from '@/ai/genkit';
import { GenerateQuizInputSchema, GenerateQuizOutputSchema, QuizQuestion } from '../schemas';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, runTransaction } from 'firebase/firestore';
import { getQuizSlotId } from '@/lib/utils';

export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
    return await generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ format, userId }) => {
    if (!db) {
        throw new Error("Firestore is not configured");
    }

    try {
        const slotId = getQuizSlotId();
        const userDocRef = doc(db, 'users', userId);
        const slotDocRef = doc(db, 'quizSlots', slotId);

        // Use a transaction to safely read and update slot/user data
        const questions = await runTransaction(db, async (transaction) => {
            // 1. Get user's seen questions and current slot's used questions
            const userDoc = await transaction.get(userDocRef);
            const slotDoc = await transaction.get(slotDocRef);
            
            const seenQuestionIds = userDoc.exists() ? userDoc.data().seenQuestionIds || [] : [];
            const slotUsedQuestionIds = slotDoc.exists() ? slotDoc.data().usedQuestionIds || [] : [];
            const excludedIds = Array.from(new Set([...seenQuestionIds, ...slotUsedQuestionIds]));
            
            // 2. Fetch available questions from the main 'questions' collection
            const questionsQuery = query(
                collection(db, 'questions'),
                where('format', '==', format === 'Mixed' ? 'Mixed' : format) // Allow format filtering
            );
            const querySnapshot = await getDocs(questionsQuery);
            let availableQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizQuestion));

            // 3. Filter out excluded questions
            let potentialQuestions = availableQuestions.filter(q => !excludedIds.includes(q.id));

            // If we don't have enough questions of the specific format, fall back to Mixed format
            if (potentialQuestions.length < 5 && format !== 'Mixed') {
                const mixedQuery = query(collection(db, 'questions'), where('format', '==', 'Mixed'));
                const mixedSnapshot = await getDocs(mixedQuery);
                const mixedQuestions = mixedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizQuestion));
                potentialQuestions.push(...mixedQuestions.filter(q => !excludedIds.includes(q.id)));
                // Ensure no duplicates if a question was in both original and mixed pool
                potentialQuestions = Array.from(new Set(potentialQuestions.map(q => q.id))).map(id => potentialQuestions.find(q => q.id === id)!);
            }
            
            if (potentialQuestions.length < 5) {
                // If still not enough, this is a critical issue. Maybe we need more questions generated.
                throw new Error(`Not enough unique questions available for format "${format}". Only found ${potentialQuestions.length}.`);
            }

            // 4. Select 5 random questions
            const selectedQuestions = potentialQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
            
            // 5. Mark these questions as used for the current slot
            const newUsedIds = selectedQuestions.map(q => q.id);
            const updatedSlotIds = Array.from(new Set([...slotUsedQuestionIds, ...newUsedIds]));
            transaction.set(slotDocRef, { usedQuestionIds: updatedSlotIds }, { merge: true });
            
            return selectedQuestions;
        });

        // The questions are returned by the transaction
        return { questions: questions.map(q => QuizQuestion.parse(q)) };

    } catch (err) {
      console.error("Quiz generation failed in flow:", err);
      throw new Error("Could not generate a unique quiz. Please try again in the next slot.");
    }
  }
);
