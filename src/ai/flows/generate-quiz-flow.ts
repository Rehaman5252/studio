
'use server';

import { GenerateQuizInputSchema, GenerateQuizOutputSchema, QuizQuestion } from '../schemas';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, runTransaction, DocumentData, getDocs, query, where } from 'firebase/firestore';
import { getQuizSlotId } from '@/lib/utils';


/**
 * Generates a quiz with 5 unique questions for a given user and format.
 * This function enforces uniqueness at both the user-level (lifetime) and slot-level (global).
 *
 * @param {object} input - The input object.
 * @param {string} input.format - The cricket format for the quiz.
 * @param {string} input.userId - The ID of the user requesting the quiz.
 * @returns {Promise<object>} A promise that resolves to the generated quiz data.
 */
export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
    const { format, userId } = GenerateQuizInputSchema.parse(input);
    
    if (!db) {
        throw new Error("Firestore is not configured. The quiz cannot be generated.");
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
            
            // 2. Fetch available questions using the client SDK. This relies on security rules allowing reads.
            const questionsCollection = collection(db, 'questions');
            let q = query(questionsCollection, where('format', '==', format));

            const querySnapshot = await getDocs(q);
            
            let availableQuestions = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentData));

            // 3. Filter out excluded questions
            let potentialQuestions = availableQuestions.filter(q => !excludedIds.includes(q.id));

            // If we don't have enough questions of the specific format, fall back to Mixed format
            if (potentialQuestions.length < 5 && format !== 'Mixed') {
                console.log(`Not enough '${format}' questions, falling back to 'Mixed' format.`);
                const mixedQuery = query(collection(db, 'questions'), where('format', '==', 'Mixed'));
                const mixedSnapshot = await getDocs(mixedQuery);
                const mixedQuestions = mixedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
                potentialQuestions.push(...mixedQuestions.filter(q => !excludedIds.includes(q.id)));
                // Ensure no duplicates if a question was in both original and mixed pool
                potentialQuestions = Array.from(new Map(potentialQuestions.map(q => [q.id, q])).values());
            }
            
            if (potentialQuestions.length < 5) {
                // If still not enough, this is a critical issue. We need more questions generated.
                throw new Error(`Not enough unique questions available for format "${format}". Only found ${potentialQuestions.length}. Please try another format or wait for the next slot.`);
            }

            // 4. Select 5 random questions
            const selectedQuestions = potentialQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
            
            // 5. Mark these questions as used for the current slot using the user-context transaction
            const newUsedIds = selectedQuestions.map(q => q.id);
            const updatedSlotIds = Array.from(new Set([...slotUsedQuestionIds, ...newUsedIds]));
            transaction.set(slotDocRef, { usedQuestionIds: updatedSlotIds }, { merge: true });
            
            return selectedQuestions;
        });

        // The questions are returned by the transaction, parse them with Zod
        // This ensures the data structure is correct before sending it back.
        const validatedQuestions = z.array(QuizQuestion).parse(questions);
        return { questions: validatedQuestions };

    } catch (err: any) {
      console.error("Quiz generation failed in flow:", err);
      // Re-throw the error to be caught by the API route
      throw new Error(err.message || "Could not generate a unique quiz. Please try again in the next slot.");
    }
}
