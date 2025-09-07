
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
    const totalTime = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
    const averageTime = attempt.totalQuestions > 0 ? totalTime / attempt.totalQuestions : 0;

    const correctQuestions = attempt.questions.filter((q, i) => q.correctAnswer === attempt.userAnswers[i]);
    const incorrectQuestions = attempt.questions.filter((q, i) => q.correctAnswer !== attempt.userAnswers[i]);

    let strengths = ["Good pace on questions you knew.", "Strong foundational knowledge."];
    if (accuracy > 80) strengths.unshift("Excellent accuracy under pressure!");
    
    let improvements = ["Double-check questions with tricky wording."];
    if (incorrectQuestions.length > 0) {
        improvements.push(`Review topics related to: "${incorrectQuestions[0].question.slice(0, 30)}..."`);
    } else {
        improvements.push("Time management on tougher questions could be improved.");
    }
    
    return {
        overallPerformance: `A solid effort on the ${attempt.format} quiz! You've got a great foundation to build upon.`,
        accuracy: parseFloat(accuracy.toFixed(1)),
        averageTimePerQuestion: parseFloat(averageTime.toFixed(1)),
        keyStrengths: strengths.slice(0,2),
        areasForImprovement: improvements.slice(0,2),
        coachTip: "Before your next quiz, try focusing on one specific era or tournament. This can help you build deeper knowledge in one go!",
        analyzedQuestions: attempt.questions.map((q, i) => ({
            question: q.question,
            userAnswer: attempt.userAnswers[i] || 'Not Answered',
            correctAnswer: q.correctAnswer,
            isCorrect: attempt.userAnswers[i] === q.correctAnswer,
            timeTaken: attempt.timePerQuestion?.[i] || 0,
            category: "General" // Fallback category
        })),
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
    1.  **Calculate Metrics:** Determine the overall accuracy percentage and the average time per question.
    2.  **Categorize Each Question:** For each question, assign a specific, granular category. Examples: 'IPL Batting Records', 'Test Match History', 'Cricket Terminology', 'Player Nicknames', 'World Cup 2011'.
    3.  **Overall Summary:** Write a brief, encouraging summary of the user's performance.
    4.  **Identify Strengths:** Based on the question categories answered correctly and quickly, identify 2-3 key strengths.
    5.  **Identify Improvement Areas:** Based on the categories where answers were incorrect or slow, identify 2-3 areas for improvement.
    6.  **Provide a Coach's Tip:** Give one single, powerful, and personalized tip for the user to focus on for their next quiz.
    7.  **Format Output:** Compile all this information into the required JSON format, including the detailed analysis for every single question.
    8. **Source**: Set the source to "ai".
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
