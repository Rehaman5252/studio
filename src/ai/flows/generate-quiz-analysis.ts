
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

const FALLBACK_ANALYSIS: Omit<QuizAnalysisOutput, 'source'> = {
  overallPerformance:
    "We could not generate a personalized analysis this time. Here's a general review.",
  accuracy: 0,
  averageTimePerQuestion: 0,
  keyStrengths: ["Good engagement with cricket knowledge.", "Strong attempt overall."],
  areasForImprovement: [
    "Review recent cricket statistics and match results.",
    "Practice time-bound quizzes to improve speed.",
  ],
  coachTip: "Focus on one format for a few days to build deep expertise before switching to another.",
  analyzedQuestions: [],
};


/**
 * Generates a deterministic, rules-based fallback analysis if the AI fails.
 * @param attempt - The sanitized quiz attempt data.
 * @returns A complete QuizAnalysisOutput object.
 */
const getFallbackAnalysis = (attempt: z.infer<typeof QuizAttempt>): QuizAnalysisOutput => {
    const accuracy = (attempt.totalQuestions > 0) ? (attempt.score / attempt.totalQuestions) * 100 : 0;
    const averageTime = (attempt.totalQuestions > 0) ? ((attempt.timePerQuestion?.reduce((a,b) => a+b, 0) || 0) / attempt.totalQuestions) : 0;

    return {
        ...FALLBACK_ANALYSIS,
        overallPerformance: `A solid effort on the ${attempt.format} quiz! You've got a great foundation to build upon.`,
        accuracy: parseFloat(accuracy.toFixed(1)),
        averageTimePerQuestion: parseFloat(averageTime.toFixed(1)),
        analyzedQuestions: attempt.questions.map((q, i) => ({
            question: q.question,
            userAnswer: attempt.userAnswers[i] || 'Not Answered',
            correctAnswer: q.correctAnswer,
            isCorrect: attempt.userAnswers[i] === q.correctAnswer,
            timeTaken: attempt.timePerQuestion?.[i] || 0,
            category: "General"
        })),
        source: 'fallback',
    };
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
        return getFallbackAnalysis(sanitized as QuizAttempt);
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

    Based on this data, generate a comprehensive analysis. Follow these steps:
    1.  **Calculate Metrics:** Determine the overall accuracy percentage and the average time per question.
    2.  **Categorize Each Question:** For each question, assign a specific, granular category. Examples: 'IPL Batting Records', 'Test Match History', 'Cricket Terminology', 'Player Nicknames', 'World Cup 2011'.
    3.  **Overall Summary:** Write a brief, encouraging summary of the user's performance.
    4.  **Identify Strengths:** Based on the question categories answered correctly and quickly, identify 2-3 key strengths.
    5.  **Identify Improvement Areas:** Based on the categories where answers were incorrect or slow, identify 2-3 areas for improvement.
    6.  **Provide a Coach's Tip:** Give one single, powerful, and personalized tip for the user to focus on for their next quiz.
    7.  **Format Output:** Compile all this information into the required JSON format, including the detailed analysis for every single question.
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
            
            // Validate the AI's output against our schema.
            const parsed = QuizAnalysisOutputSchema.safeParse(output);
            
            if (!parsed.success) {
                console.error("AI analysis returned invalid shape:", parsed.error);
                throw new Error("AI output validation failed.");
            }

            return { ...parsed.data, source: 'ai' };
        } catch (error) {
             console.error("Error during AI analysis flow execution:", error);
             // Instead of re-throwing, we now return the deterministic fallback.
             return getFallbackAnalysis(input);
        }
    }
);
