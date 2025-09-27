
'use server';

/**
 * @fileOverview A flow to handle user reports for quiz questions.
 * This flow writes the report to a 'reportedQuestions' collection in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ReportQuestionInputSchema = z.object({
  questionId: z.string().describe("The ID of the question being reported."),
  questionText: z.string().describe("The full text of the question."),
  reason: z.string().min(1, { message: "A reason is required." }).describe("The reason for the report."),
  comment: z.string().optional().describe("An optional comment from the user."),
  userId: z.string().describe("The ID of the user submitting the report."),
});

export type ReportQuestionInput = z.infer<typeof ReportQuestionInputSchema>;

export const ReportQuestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  reportId: z.string().optional(),
});

export async function reportQuestion(input: ReportQuestionInput): Promise<z.infer<typeof ReportQuestionOutputSchema>> {
  return reportQuestionFlow(input);
}

export const reportQuestionFlow = ai.defineFlow(
  {
    name: 'reportQuestionFlow',
    inputSchema: ReportQuestionInputSchema,
    outputSchema: ReportQuestionOutputSchema,
  },
  async (input: z.infer<typeof ReportQuestionInputSchema>): Promise<z.infer<typeof ReportQuestionOutputSchema>> => {
    if (!db) {
      return { success: false, message: "Database connection not available." };
    }
    
    try {
      const reportedQuestionsCollection = collection(db, 'reportedQuestions');
      const docRef = await addDoc(reportedQuestionsCollection, {
        ...input,
        reportedAt: serverTimestamp(),
        status: 'new', // e.g., 'new', 'reviewed', 'resolved'
      });
      
      return {
        success: true,
        message: 'Your report has been submitted successfully. Thank you for helping us improve!',
        reportId: docRef.id,
      };
    } catch (error) {
      console.error("Error in reportQuestionFlow:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to submit report: ${errorMessage}`,
      };
    }
  }
);
    