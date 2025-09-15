
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

const getFallbackAnalysis = (attempt: z.infer<typeof QuizAttempt>): QuizAnalysisOutput => {
    const accuracy = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
    
    let strengths = ["Good pace on questions you knew.", "Strong foundational knowledge."];
    if (accuracy > 80) strengths.unshift("Excellent accuracy under pressure!");
    
    let weaknesses = ["Double-check questions with tricky wording."];
    const incorrectQuestions = attempt.questions.filter((q, i) => q.correctAnswer !== attempt.userAnswers[i]);
    if (incorrectQuestions.length > 0) {
        weaknesses.push(`Struggled with topics related to: "${incorrectQuestions[0].question.slice(0, 30)}..."`);
    } else if (attempt.totalQuestions > 0) {
        weaknesses.push("Time management on tougher questions could be improved.");
    } else {
        weaknesses.push("No questions were answered to analyze weaknesses.");
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
    const sanitized = sanitizeQuizAttempt(rawAttempt);

    if (!sanitized || !sanitized.userId) {
        console.error("[generateQuizAnalysis] Sanitization failed or missing userId, returning fallback.", { rawAttempt });
        const dummyAttempt = { format: 'cricket', score: 0, totalQuestions: 5, questions: [], userAnswers: [] } as any;
        return getFallbackAnalysis(dummyAttempt);
    }
    
    try {
        const validatedAttempt = QuizAttempt.parse(sanitized as z.infer<typeof QuizAttempt>);
        const analysis = await generateQuizAnalysisFlow(validatedAttempt);
        
        const parsed = QuizAnalysisOutputSchema.safeParse(analysis);

        if (!parsed.success) {
            console.error("[generateQuizAnalysis] AI output from flow failed validation, returning fallback.", parsed.error.format());
            return getFallbackAnalysis(validatedAttempt);
        }
        
        return parsed.data;

    } catch (error: any) {
        console.error("Error in analysis generation pipeline. Returning fallback.", error?.errors ?? error);
        return getFallbackAnalysis(sanitized as z.infer<typeof QuizAttempt>);
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

    Based on this data, generate a comprehensive analysis. Follow these steps precisely:
    1.  **summary:** Write a brief, encouraging summary (1-2 sentences) of the user's performance, mentioning their score.
    2.  **strengths:** Based on the questions answered correctly and quickly, identify 1-2 key strengths.
    3.  **weaknesses:** Based on the questions where answers were incorrect or slow, identify 1-2 areas for improvement.
    4.  **recommendations:** Provide 3 concrete, actionable recommendations for the user to focus on.
    5.  **source**: Set this field to "ai".
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
                 console.error("[generateQuizAnalysisFlow] AI output schema validation failed. Full output:", JSON.stringify(output, null, 2));
                 throw new Error("AI returned incomplete or invalid analysis data.");
            }
    
            return { ...parsed.data, source: "ai" };

        } catch (error) {
             console.error("Error during AI analysis flow execution. Returning fallback.", error);
             return getFallbackAnalysis(input);
        }
    }
);
    