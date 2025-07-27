
'use server';

/**
 * @fileOverview A flow to generate and store cricket quiz questions in Firestore.
 * This is intended to be run periodically by a scheduled job.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { QuizQuestion } from '../schemas';

const GenerateQuestionsInputSchema = z.object({
  count: z.number().min(1).max(50).default(20),
  format: z.string().default('Mixed'),
});

const GeneratedQuestionSchema = z.object({
  format: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateCricketQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `You are an expert cricket quiz master. Generate {{count}} unique, high-quality, and engaging multiple-choice quiz questions about the "{{format}}" cricket format.
  
  Each question must have exactly four options.
  One of the options must be the correct answer.
  Provide a brief, clear explanation for the correct answer.
  Ensure the questions cover a wide range of topics within the format, including players, records, history, and rules.
  Do not repeat questions.
  `,
});

export const generateAndStoreQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAndStoreQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: z.object({
        success: z.boolean(),
        storedCount: z.number(),
        message: z.string(),
    }),
  },
  async (input) => {
    if (!db) {
      throw new Error("Firestore is not configured.");
    }
    
    try {
      const { output } = await generateQuestionsPrompt(input);
      
      if (!output || !output.questions || output.questions.length === 0) {
        return { success: false, storedCount: 0, message: "AI failed to generate any questions." };
      }

      const batch = writeBatch(db);
      const questionsCollection = collection(db, 'questions');
      let storedCount = 0;

      for (const q of output.questions) {
        // Validate that the correct answer is one of the options
        if (q.options.includes(q.correctAnswer)) {
            const newQuestionRef = doc(questionsCollection);
            const questionWithId: z.infer<typeof QuizQuestion> = {
                id: newQuestionRef.id,
                ...q,
            };
            batch.set(newQuestionRef, questionWithId);
            storedCount++;
        }
      }

      await batch.commit();

      return {
        success: true,
        storedCount,
        message: `Successfully generated and stored ${storedCount} new questions.`,
      };

    } catch (error) {
        console.error("Error in generateAndStoreQuestionsFlow:", error);
        return {
            success: false,
            storedCount: 0,
            message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
  }
);
