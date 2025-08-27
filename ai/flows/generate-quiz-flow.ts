
'use server';

/**
 * @fileOverview Generates a 5-question cricket quiz for a specific format.
 *
 * This flow creates a unique quiz with questions, options, correct answers, and explanations.
 * It ensures questions are not repeated for the same user within a short timeframe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizQuestion, QuizData } from '@/ai/schemas';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFallbackQuiz } from '@/lib/fallback-quiz';


const GenerateQuizInputSchema = z.object({
    format: z.string().describe('The cricket format for the quiz (e.g., T20, IPL, Test).'),
    userId: z.string().describe('The ID of the user requesting the quiz to avoid repeating questions.'),
});
type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;


const getRecentQuestions = async (userId: string): Promise<string[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'users', userId, 'quizAttempts'),
            orderBy('timestamp', 'desc'),
            limit(5) // Look at last 5 attempts to avoid recent repeats
        );
        const querySnapshot = await getDocs(q);
        const seenQuestions = new Set<string>();
        querySnapshot.forEach(doc => {
            const attempt = doc.data();
            if (attempt.questions) {
                attempt.questions.forEach((question: QuizQuestion) => {
                    seenQuestions.add(question.question);
                });
            }
        });
        return Array.from(seenQuestions);
    } catch (error) {
        console.error("Error fetching recent questions:", error);
        return [];
    }
}

const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: {
        schema: z.object({
            format: z.string(),
            seenQuestions: z.array(z.string()),
        }),
    },
    output: { schema: QuizData },
    prompt: `
    You are a world-class cricket expert designing a quiz.
    Generate a 5-question multiple-choice quiz about "{{format}}" cricket.

    Each question must include:
    - A unique ID (a short random string like "q1a2b").
    - The question text.
    - An array of 4 distinct string options.
    - The correct answer, which must exactly match one of the options.
    - A brief, engaging explanation for the correct answer.

    The questions should be challenging but fair, covering a range of topics like history, records, rules, and famous players related to the format.

    IMPORTANT: Do NOT generate any questions that are similar to the ones in this list of recently seen questions:
    {{#each seenQuestions}}
    - "{{this}}"
    {{/each}}
  `,
    config: {
        // Set extremely permissive safety settings to prevent the model from blocking valid responses.
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
        ],
    }
});


export const generateQuizFlow = ai.defineFlow(
    {
        name: 'generateQuizFlow',
        inputSchema: GenerateQuizInputSchema,
        outputSchema: QuizData,
    },
    async (input) => {
        try {
            const seenQuestions = await getRecentQuestions(input.userId);

            const { output } = await prompt({ format: input.format, seenQuestions });
            
            // Basic validation to ensure the AI returns something valid
            if (!output || !Array.isArray(output.questions) || output.questions.length < 5) {
                 console.error("AI failed to generate a valid quiz. Using fallback.");
                 throw new Error("AI returned incomplete or invalid quiz data.");
            }
    
            return output;
        } catch (error) {
            console.error("Error in generateQuizFlow, throwing to be handled by API route:", error);
            // Re-throw the error so the robust API route can catch it and serve its own fallback.
            throw error;
        }
    }
);
