
'use server';

/**
 * @fileOverview A flow that generates an AI-powered analysis of a user's quiz attempt.
 *
 * - generateQuizAnalysis - A function that provides a detailed performance breakdown.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttempt, QuizAnalysisOutputSchema } from '@/ai/schemas';
import { sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';
import type { QuizAnalysisOutput } from '@/ai/schemas';


/**
 * Generates a deterministic, rules-based fallback analysis if the AI fails.
 * @param attempt - The sanitized quiz attempt data.
 * @returns A complete QuizAnalysisOutput object.
 */
const getFallbackAnalysis = (attempt: z.infer<typeof QuizAttempt>): QuizAnalysisOutput => {
    const accuracy = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
    
    let strengths = ["Good pace on questions you knew.", "Strong foundational knowledge."];
    if (accuracy > 80) strengths.unshift("Excellent accuracy under pressure!");
    
    let weaknesses = ["Double-check questions with tricky wording."];
    const incorrectQuestions = attempt.questions.filter((q, i) => q.correctAnswer !== attempt.userAnswers[i]);
    if (incorrectQuestions.length > 0) {
        weaknesses.push(`Struggled with topics related to: "${incorrectQuestions[0].question.slice(0, 30)}..."`);
    } else {
        weaknesses.push("Time management on tougher questions could be improved.");
    }
    
    return {
        summary: `A solid effort on the ${attempt.format} quiz! You scored ${attempt.score} out of ${attempt.totalQuestions}. You've got a great foundation to build upon.`,
        strengths: strengths.slice(0,2),
        weaknesses: weaknesses.slice(0,2),
        recommendations: [
            "Review the questions you got wrong and understand the explanations.",
            "Focus on one specific era or tournament before your next quiz to build deeper knowledge.",
            "Try to answer a bit faster on questions you feel confident about."
        ],
        source: "fallback",
    };
};


export async function generateQuizAnalysis(rawAttempt: any): Promise<QuizAnalysisOutput> {
    try {
        const sanitized = sanitizeQuizAttempt(rawAttempt);
        const validatedAttempt = QuizAttempt.parse(sanitized as z.infer<typeof QuizAttempt>);
        const analysis = await generateQuizAnalysisFlow(validatedAttempt);
        
        const parsed = QuizAnalysisOutputSchema.safeParse(analysis);

        if (!parsed.success) {
            console.error("[generateQuizAnalysis] AI output failed validation, returning fallback.", parsed.error.format());
            return getFallbackAnalysis(validatedAttempt);
        }
        
        return parsed.data;

    } catch (error: any) {
        console.error("Error in analysis generation pipeline. Returning fallback.", error?.errors ?? error);
        const sanitizedForFallback = sanitizeQuizAttempt(rawAttempt);
        return getFallbackAnalysis(sanitizedForFallback as z.infer<typeof QuizAttempt>);
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
    1.  **summary:** Write a brief, encouraging summary of the user's performance.
    2.  **strengths:** Based on the questions answered correctly and quickly, identify 2-3 key strengths.
    3.  **weaknesses:** Based on the questions where answers were incorrect or slow, identify 2-3 areas for improvement.
    4.  **recommendations:** Provide 2-3 concrete, actionable recommendations for the user to focus on.
    5.  **source**: Set the source to "ai".
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
            if (!output) {
                throw new Error("AI analysis returned a null or empty response.");
            }
            return { ...output, source: "ai" };
        } catch (error) {
             console.error("Error during AI analysis flow execution:", error);
             return getFallbackAnalysis(input);
        }
    }
);
