
'use server';

/**
 * @fileOverview A flow that generates an AI-powered analysis of a user's quiz attempt.
 *
 * - generateQuizAnalysis - A function that provides a detailed performance breakdown.
 * This flow is hardened to never throw an error for AI failures. It validates its own
 * output and returns a high-quality fallback analysis if the AI fails or produces
 * an invalid response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttempt, QuizAnalysisOutput, QuizAnalysisOutputSchema } from '@/ai/schemas';
import { sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';


const fallbackAnalysis: QuizAnalysisOutput = {
  summary: "We could not generate a personalized analysis this time. Here's a general review.",
  strengths: ["Good engagement with cricket knowledge.", "Strong attempt overall."],
  weaknesses: ["AI analysis was unavailable for this session."],
  recommendations: [
    "Review recent cricket statistics and match results.",
    "Practice time-bound quizzes to improve speed.",
  ],
  source: "fallback",
};


export async function generateQuizAnalysis(rawAttempt: any): Promise<QuizAnalysisOutput> {
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const sanitized = sanitizeQuizAttempt(rawAttempt);
        
    try {
        const validatedAttempt = QuizAttempt.parse(sanitized);
        console.info(`[analysis][${reqId}] Starting analysis for user ${validatedAttempt.userId}, slot ${validatedAttempt.slotId}`);
        const analysis = await generateQuizAnalysisFlow(validatedAttempt);
        return analysis;
    } catch (error: any) {
        console.error(`[analysis][${reqId}] Validation failed for quiz attempt. Returning fallback.`, {
            userId: sanitized.userId,
            slotId: sanitized.slotId,
            error: error?.errors ?? error,
        });
        return fallbackAnalysis;
    }
}

const prompt = ai.definePrompt({
    name: 'generateQuizAnalysisPrompt',
    input: { schema: QuizAttempt },
    output: { schema: QuizAnalysisOutputSchema },
    prompt: `
    You are an expert cricket quiz analyst and coach. Your goal is to provide an insightful, detailed, and helpful performance analysis for a user based on their recent quiz attempt. Be encouraging but also provide concrete, actionable feedback.

    Analyze the following quiz data for the "{{format}}" format:
    - Score: {{score}} out of {{totalQuestions}}
    - Questions, User Answers, and Time Taken:
      {{#each questions}}
      - Q{{@index + 1}}: {{this.question}}
        - Your Answer: {{../userAnswers.[@index]}}
        - Correct Answer: {{this.correctAnswer}}
        - Time Taken: {{../timePerQuestion.[@index]}}s
      {{/each}}

    Based on this data, generate a comprehensive analysis. Respond in a JSON object with the following keys: "summary", "strengths", "weaknesses", "recommendations".
    - summary: A concise, one-paragraph summary of the user's performance.
    - strengths: An array of 2-3 strings highlighting what the user did well.
    - weaknesses: An array of 2-3 strings pointing out areas for improvement.
    - recommendations: An array of 2-3 actionable tips for the user.
  `,
});


const generateQuizAnalysisFlow = ai.defineFlow(
    {
        name: 'generateQuizAnalysisFlow',
        inputSchema: QuizAttempt,
        outputSchema: QuizAnalysisOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await prompt(input);
            const parsed = QuizAnalysisOutputSchema.safeParse(output);
            
            if (!parsed.success) {
                console.error("[AnalysisFlow] Schema validation failed:", parsed.error.format());
                return fallbackAnalysis;
            }

            return { ...parsed.data, source: "ai" };
        } catch (error) {
             console.error("[AnalysisFlow] Unexpected error:", error);
             return fallbackAnalysis;
        }
    }
);
